const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');
const { type } = require('os');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
    MONGODB_URL: Joi.string().required().description('Mongo DB url'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which reset password token expires'),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which verify email token expires'),
    SMTP_HOST: Joi.string().description('server that will send the emails'),
    SMTP_PORT: Joi.number().description('port to connect to the email server'),
    SMTP_USERNAME: Joi.string().description('username for email server'),
    SMTP_PASSWORD: Joi.string().description('password for email server'),
    EMAIL_FROM: Joi.string().description('the from field in the emails sent by the app'),
    AWS_REGION: Joi.string().description('AWS region for S3'),
    AWS_ACCESS_KEY_ID: Joi.string().description('AWS access key ID'),
    AWS_SECRET_ACCESS_KEY: Joi.string().description('AWS secret access key'),
    AWS_S3_BUCKET_NAME: Joi.string().description('AWS S3 bucket name'),
    type: Joi.string().description('Firebase type'),
    project_id: Joi.string().description('Firebase project_id'),
    private_key_id: Joi.string().description('Firebase private_key_id'),
    private_key: Joi.string().description('Firebase private_key'),
    client_email: Joi.string().description('Firebase client_email'),
    client_id: Joi.string().description('Firebase client_id'),
    auth_uri: Joi.string().description('Firebase auth_uri'),
    token_uri: Joi.string().description('Firebase token_uri'),
    auth_provider_x509_cert_url: Joi.string().description('Firebase auth_provider_x509_cert_url'),
    client_x509_cert_url: Joi.string().description('Firebase client_x509_cert_url'),
    universe_domain: Joi.string().description('Firebase universe_domain'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoose: {
    url: envVars.MONGODB_URL + (envVars.NODE_ENV === 'test' ? '-test' : ''),
    options: {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      secure: true,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
  },
  aws: {
    region: envVars.AWS_REGION,
    accessKeyId: envVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
    s3BucketName: envVars.AWS_S3_BUCKET_NAME,
  },
  firebase: {
    type: envVars.type,
    project_id: envVars.project_id,
    private_key_id: envVars.private_key_id,
    private_key: envVars.private_key ? envVars.private_key.replace(/\\n/g, '\n') : undefined,
    client_email: envVars.client_email,
    client_id: envVars.client_id,
    auth_uri: envVars.auth_uri,
    token_uri: envVars.token_uri,
    auth_provider_x509_cert_url: envVars.auth_provider_x509_cert_url,
    client_x509_cert_url: envVars.client_x509_cert_url,
    universe_domain: envVars.universe_domain,
  },
};
