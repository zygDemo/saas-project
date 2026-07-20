import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private transporter: nodemailer.Transporter

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('SMTP_HOST', 'smtp.qq.com'),
      port: config.get<number>('SMTP_PORT', 465),
      secure: config.get<boolean>('SMTP_SECURE', true),
      auth: {
        user: config.get<string>('SMTP_USER'),
        pass: config.get<string>('SMTP_PASS'),
      },
    })
  }

  /** 发送验证码邮件 */
  async sendVerificationCode(to: string, code: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('MAIL_FROM'),
        to,
        subject: '【予艺助手】邮箱验证码',
        html: `
          <div style="max-width:480px;margin:0 auto;padding:24px;font-family:sans-serif;">
            <h2 style="color:#333;">邮箱验证码</h2>
            <p>您正在注册/登录予艺助手，验证码为：</p>
            <div style="background:#f5f5f5;padding:16px;border-radius:8px;text-align:center;font-size:28px;letter-spacing:8px;font-weight:bold;color:#1677ff;">
              ${code}
            </div>
            <p style="color:#999;font-size:13px;margin-top:16px;">验证码 5 分钟内有效，请勿泄露给他人。</p>
          </div>
        `,
      })
      this.logger.log(`验证码已发送至 ${to}`)
      return true
    } catch (error) {
      this.logger.error(`邮件发送失败: ${error}`)
      return false
    }
  }
}
