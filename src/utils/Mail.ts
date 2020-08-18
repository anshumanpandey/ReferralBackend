import { readFileSync } from "fs"
import { join } from "path"
import { render } from "mustache"
import { createTransport } from "nodemailer"

// async..await is not allowed in global scope, must use a wrapper
export async function sendEmail({ email, token, name, title, user, achivement, feedback }:{ email: string, token: string, name: string, title: string, user:any, achivement: any, feedback: any}) {

    // create reusable transporter object using the default SMTP transport
    let transporter = createTransport({
        service: 'gmail',
        auth: {
            user: 'thelox95@gmail.com',
            pass: 'qhvzmcllegwhguje' // naturally, replace both with your real credentials or an application-specific password
        }
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: 'thelox95@gmail.com', // sender address
        to: email, // list of receivers
        subject: "Please give us your feedback", // Subject line
        html: render(
            readFileSync(join(__dirname, '..', '..', 'templates', 'mail.html'), 
            { encoding: 'utf8' }), {
                assets_url: process.env.ASSETS_URL,
                form_url: `${process.env.API_URL}/feedback/form?token=${token}&name=${name}&title=${title}`,
                user,
                achivement,
                feedback,
            }
        ),
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

}

export async function sendForgotPassword({ email, password }:{ email: string, password: string, user: any}) {

    // create reusable transporter object using the default SMTP transport
    let transporter = createTransport({
        service: 'gmail',
        auth: {
            user: 'thelox95@gmail.com',
            pass: 'qhvzmcllegwhguje' // naturally, replace both with your real credentials or an application-specific password
        }
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: 'thelox95@gmail.com', // sender address
        to: email, // list of receivers
        subject: "Your new password for Passport app", // Subject line
        html: render(
            readFileSync(join(__dirname, '..', '..', 'templates', 'forgot_password.html'), 
            { encoding: 'utf8' }), {
                assets_url: process.env.ASSETS_URL,
                password,
            }
        ),
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

}