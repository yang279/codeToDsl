import styles from '../styles/Dashboard.module.css'
import NavBar from '../components/NavBar'

export default function Dashboard() {
  return (
    <div className={styles.page}>
      <NavBar />

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <nav className={styles.sideNav}>
            <a className={`${styles.navItem} ${styles.navItemActive}`} href="/dashboard">概览</a>
            <a className={styles.navItem} href="/projects">我的项目</a>
            <a className={styles.navItem} href="/tasks">任务列表</a>
            <a className={styles.navItem} href="/messages">消息</a>
          </nav>
        </aside>

        <main className={styles.main}>
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>进行中项目</span>
              <span className={styles.statValue}>12</span>
              <span className={styles.statChange}>+3 本月</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>待完成任务</span>
              <span className={styles.statValue}>48</span>
              <span className={styles.statChange}>-5 本周</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>团队成员</span>
              <span className={styles.statValue}>8</span>
              <span className={styles.statChange}>无变化</span>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>最近项目</h2>
              <button>查看全部</button>
            </div>

            <div className={styles.projectList}>
              <div className={styles.projectItem}>
                <div className={styles.projectIcon} style={{ backgroundColor: '#eef2ff' }} />
                <div className={styles.projectMeta}>
                  <span className={styles.projectName}>设计系统重构</span>
                  <span className={styles.projectDesc}>UI 组件库升级与规范统一</span>
                </div>
              </div>

              <div className={styles.projectItem}>
                <div className={styles.projectIcon} style={{ backgroundColor: '#f0fdf4' }} />
                <div className={styles.projectMeta}>
                  <span className={styles.projectName}>移动端适配</span>
                  <span className={styles.projectDesc}>响应式布局全面改造</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
