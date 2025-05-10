const nodemailer = require("nodemailer");
const logger = require("../config/logger");

/**
 * Initialize email transporter
 */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send task notification email
 * @param {Object} user - User object
 * @param {Object} task - Task object
 * @returns {Promise} Promise that resolves when email is sent
 */
const sendTaskNotification = async (user, task) => {
  try {
    const mailOptions = {
      from: `"PMI Onboarding" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: `New task assigned: ${task.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0072CE;">New Task Assignment</h2>
          <p>Hello ${user.fullName},</p>
          <p>You have been assigned a new task:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #333;">${task.title}</h3>
            <p>${task.description || "No description provided"}</p>
            <p><strong>Due date:</strong> ${new Date(
              task.dueDate
            ).toLocaleDateString()}</p>
            <p><strong>Priority:</strong> ${task.priority}</p>
          </div>
          <p>Please login to the PMI Onboarding Portal to view the details and mark the task as complete once finished.</p>
          <p style="margin-top: 20px;">Best regards,<br>PMI Onboarding Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(
      `Task notification email sent to ${user.email} for task ${task.title}`
    );
    return true;
  } catch (error) {
    logger.error(`Error sending task notification email: ${error.message}`);
    return false;
  }
};

/**
 * Send evaluation notification email
 * @param {Object} user - User object
 * @param {Object} evaluation - Evaluation object
 * @returns {Promise} Promise that resolves when email is sent
 */
const sendEvaluationNotification = async (user, evaluation) => {
  try {
    const mailOptions = {
      from: `"PMI Onboarding" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: `New evaluation: ${evaluation.type}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0072CE;">New Evaluation</h2>
          <p>Hello ${user.fullName},</p>
          <p>A new ${evaluation.type} evaluation has been created for you.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Type:</strong> ${evaluation.type}</p>
            <p><strong>Due date:</strong> ${new Date(
              evaluation.dueDate
            ).toLocaleDateString()}</p>
          </div>
          <p>Please login to the PMI Onboarding Portal to view the details.</p>
          <p style="margin-top: 20px;">Best regards,<br>PMI Onboarding Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(
      `Evaluation notification email sent to ${user.email} for evaluation ${evaluation._id}`
    );
    return true;
  } catch (error) {
    logger.error(
      `Error sending evaluation notification email: ${error.message}`
    );
    return false;
  }
};

/**
 * Send onboarding phase complete notification email
 * @param {Object} user - User object
 * @param {string} phase - Completed phase
 * @returns {Promise} Promise that resolves when email is sent
 */
const sendPhaseCompleteNotification = async (user, phase) => {
  try {
    const mailOptions = {
      from: `"PMI Onboarding" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: `Onboarding phase complete: ${phase}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0072CE;">Onboarding Phase Complete</h2>
          <p>Hello ${user.fullName},</p>
          <p>Congratulations! You have completed the following phase of your onboarding journey:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center;">
            <h3 style="margin-top: 0; color: #0072CE; text-transform: capitalize;">${phase}</h3>
          </div>
          <p>Please login to the PMI Onboarding Portal to continue with your onboarding journey.</p>
          <p style="margin-top: 20px;">Best regards,<br>PMI Onboarding Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(
      `Phase complete notification email sent to ${user.email} for phase ${phase}`
    );
    return true;
  } catch (error) {
    logger.error(
      `Error sending phase complete notification email: ${error.message}`
    );
    return false;
  }
};

/**
 * Send welcome email
 * @param {Object} user - User object
 * @param {string} password - User's initial password
 * @returns {Promise} Promise that resolves when email is sent
 */
const sendWelcomeEmail = async (user, password) => {
  try {
    const mailOptions = {
      from: `"PMI Onboarding" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: "Welcome to PMI Onboarding Portal",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0072CE;">Welcome to PMI!</h2>
          <p>Hello ${user.fullName},</p>
          <p>Welcome to the Philip Morris International team! Your account has been created on the PMI Onboarding Portal.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Temporary Password:</strong> ${password}</p>
          </div>
          <p>Please login to the PMI Onboarding Portal and change your password as soon as possible.</p>
          <p style="margin-top: 20px;">Best regards,<br>PMI Onboarding Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Welcome email sent to ${user.email}`);
    return true;
  } catch (error) {
    logger.error(`Error sending welcome email: ${error.message}`);
    return false;
  }
};

module.exports = {
  sendTaskNotification,
  sendEvaluationNotification,
  sendPhaseCompleteNotification,
  sendWelcomeEmail,
};
