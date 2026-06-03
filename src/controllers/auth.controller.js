const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../services');
const { generateOTP } = require('../utils/otp');
const redisClient = require('../utils/redisClient');
const { firebaseService } = require('../services');

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);

  // Generate OTP, store in Redis, and send via email

  const otp = generateOTP();
  const otpKey = `otp:${user.email}`;
  await redisClient.setEx(otpKey, 600, otp); // 600 seconds = 10 minutes
  await emailService.sendOtpEmail(user.email, otp);
  res.status(httpStatus.CREATED).send({ user });
  // Verify OTP controller using Redis
});

const sendOtp = catchAsync(async (req, res) => {
  const { email } = req.body;
  const user = await userService.getUserByEmail(email);
  if (!user) {
    return res.status(httpStatus.NOT_FOUND).send({ message: 'User not found' });
  }
  const otp = generateOTP();
  const otpKey = `otp:${email}`;
  await redisClient.setEx(otpKey, 600, otp); // 600 seconds = 10 minutes
  await emailService.sendOtpEmail(email, otp);
  res.status(httpStatus.OK).send({ message: 'OTP sent successfully' });
});

const verifyOtp = catchAsync(async (req, res) => {
  const { email, otp } = req.body;

  const otpKey = `otp:${email}`;
  const storedOtp = await redisClient.get(otpKey);
  if (!storedOtp) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: 'OTP expired or not found' });
  }
  if (storedOtp !== otp) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: 'Invalid OTP' });
  }
  await redisClient.del(otpKey);
  // Optionally, mark user as verified
  const user = await userService.getUserByEmail(email);
  if (user) {
    user.isEmailVerified = true;
    await user.save();
  }

  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.OK).send({ message: 'OTP verified successfully', tokens, user });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  if (!user.isEmailVerified) {
    const otp = generateOTP();
    const otpKey = `otp:${user.email}`;
    await redisClient.setEx(otpKey, 600, otp); // 600 seconds = 10 minutes
    await emailService.sendOtpEmail(user.email, otp);
    res.send({ user });
  }
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPasswordWithOtp = catchAsync(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  console.log('Reset password with OTP:', { email, otp, newPassword });
  const user = await userService.getUserByEmail(email);
  if (!user) {
    return res.status(httpStatus.NOT_FOUND).send({ message: 'User not found' });
  }
  const otpKey = `otp:${email}`;
  const storedOtp = await redisClient.get(otpKey);
  if (!storedOtp) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: 'OTP expired or not found' });
  }
  if (storedOtp !== otp) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: 'Invalid OTP' });
  }
  await redisClient.del(otpKey);
  await userService.updateUserById(user.id, { password: newPassword });
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

// Social login using Firebase ID token (Google, Apple, Facebook via Firebase)
const socialLogin = catchAsync(async (req, res) => {
  const { idToken, loginProvider, role, token: clientToken, FCMToken, appleUserId, name, profilePicture } = req.body;
  if (!idToken) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: 'idToken required' });
  }

  // verify token with firebase
  const decoded = await firebaseService.verifyIdToken(idToken);
  // decoded may contain uid, email, name, picture, and firebase.sign_in_provider
  const providerId = decoded.uid || appleUserId;
  let provider =
    decoded.firebase && decoded.firebase.sign_in_provider ? decoded.firebase.sign_in_provider : loginProvider || 'firebase';

  // normalize provider (firebase may provide 'apple.com' etc.) -> 'apple'
  if (typeof provider === 'string') {
    provider = provider.replace('.com', '').toLowerCase();
  }

  const email = decoded.email || req.body.email; // client may pass email for Apple
  const emailVerified = decoded.email_verified || decoded.emailVerified || false;

  // Prefer lookup by providerId
  let user = providerId ? await userService.getUserByProviderId(providerId) : null;

  // If not found by providerId, fallback to email lookup
  if (!user && email) {
    user = await userService.getUserByEmail(email);
    // attach providerId to existing account if missing
    if (user && !user.providerId) {
      user.provider = provider;
      user.providerId = providerId;
      user.isEmailVerified = user.isEmailVerified || emailVerified;
      // attach client tokens / FCM into oauthTokens object
      user.oauthTokens = Object.assign({}, user.oauthTokens || {}, { clientToken, fcm: FCMToken });
      await user.save();
    }
  }

  // If still not found, create a new user. For Apple, email may be missing; require frontend to provide email
  if (!user) {
    if (!email) {
      return res.status(httpStatus.BAD_REQUEST).send({
        message:
          'Email is required for account creation. Apple returns email only on first sign-in — collect email on the client and send it to the server.',
      });
    }

    const newUser = {
      name: decoded.name || decoded.displayName || name || 'Social User',
      email,
      // keep random password for compatibility with current schema
      password: Math.random().toString(36).slice(-8),
      isEmailVerified: emailVerified || true,
      provider,
      providerId,
      profilePicture: decoded.picture || decoded.photoURL || profilePicture,
      oauthTokens: { clientToken, fcm: FCMToken },
    };
    user = await userService.createUser(newUser);
  } else {
    // update oauthTokens for existing user
    user.oauthTokens = Object.assign({}, user.oauthTokens || {}, { clientToken, fcm: FCMToken });
    await user.save();
  }

  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  verifyOtp,
  sendOtp,
  resetPasswordWithOtp,
  socialLogin,
};
