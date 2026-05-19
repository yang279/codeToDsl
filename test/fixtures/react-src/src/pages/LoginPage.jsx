import { useState } from 'react'
import styles from '../styles/LoginPage.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.title}>欢迎回来</div>
        <div className={styles.subtitle}>请输入账号和密码登录</div>

        <div className={styles.formGroup}>
          <label className={styles.label}>邮箱</label>
          <input
            className={styles.input}
            type="email"
            placeholder="请输入邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>密码</label>
          <input
            className={styles.input}
            type="password"
            placeholder="请输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className={styles.submitBtn}>登录</button>

        <div className={styles.footer}>
          <span>还没有账号？</span>
          <a className={styles.registerLink} href="/register">立即注册</a>
        </div>
      </div>
    </div>
  )
}
