import styles from './NavBar.module.css'

export default function NavBar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.brand}>
        <img className={styles.logo} src="/logo.png" alt="logo" />
        <span className={styles.brandName}>WorkSpace</span>
      </div>
      <div className={styles.menu}>
        <a className={styles.menuItem} href="/dashboard">首页</a>
        <a className={styles.menuItem} href="/projects">项目</a>
        <a className={styles.menuItem} href="/team">团队</a>
      </div>
      <div className={styles.actions}>
        <button className={styles.notifyBtn}>通知</button>
        <img className={styles.avatar} src="/avatar.png" alt="avatar" />
      </div>
    </nav>
  )
}
