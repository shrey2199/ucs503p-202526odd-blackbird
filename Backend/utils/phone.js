const twilio = require('twilio');

const sendOtp = async (options, res) => {
    const phoneOptions = {
        from: options.from,
        to: options.to,
        body: options.body
    };

    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

    try {
        await client.messages.create(phoneOptions);
    } catch(err) {
        res.status(500).json({
            status: 'fail',
            message: 'Failed to send OTP'
        });
    }

}

module.exports = sendOtp;