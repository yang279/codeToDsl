<template>
  <div class="page">
    <NavBar />

    <div class="page-body">
      <!-- 左侧边栏 -->
      <aside class="sidebar">
        <UserCard />

        <nav class="side-nav">
          <router-link class="nav-item nav-item--active" to="/dashboard">概览</router-link>
          <router-link class="nav-item" to="/projects">我的项目</router-link>
          <router-link class="nav-item" to="/tasks">任务列表</router-link>
          <router-link class="nav-item" to="/messages">消息</router-link>
          <router-link class="nav-item" to="/settings">设置</router-link>
        </nav>
      </aside>

      <!-- 主内容区 -->
      <main class="main-content">
        <!-- 统计卡片行 -->
        <div class="stats-row">
          <div class="stat-card">
            <span class="stat-card__label">进行中项目</span>
            <span class="stat-card__value">12</span>
            <span class="stat-card__change stat-card__change--up">+3 本月</span>
          </div>
          <div class="stat-card">
            <span class="stat-card__label">待完成任务</span>
            <span class="stat-card__value">48</span>
            <span class="stat-card__change stat-card__change--down">-5 本周</span>
          </div>
          <div class="stat-card">
            <span class="stat-card__label">团队成员</span>
            <span class="stat-card__value">8</span>
            <span class="stat-card__change">无变化</span>
          </div>
        </div>

        <!-- 最近项目列表 -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">最近项目</h2>
            <button class="btn-text">查看全部</button>
          </div>

          <div class="project-list">
            <div class="project-item">
              <div class="project-icon" style="background-color: #eef2ff;"></div>
              <div class="project-meta">
                <span class="project-name">设计系统重构</span>
                <span class="project-desc">UI 组件库升级与规范统一</span>
              </div>
              <div class="project-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: 75%;"></div>
                </div>
                <span class="progress-text">75%</span>
              </div>
              <span class="project-deadline">12月31日</span>
            </div>

            <div class="project-item">
              <div class="project-icon" style="background-color: #f0fdf4;"></div>
              <div class="project-meta">
                <span class="project-name">移动端适配</span>
                <span class="project-desc">响应式布局全面改造</span>
              </div>
              <div class="project-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: 40%;"></div>
                </div>
                <span class="progress-text">40%</span>
              </div>
              <span class="project-deadline">1月15日</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import NavBar from '../components/NavBar.vue'
import UserCard from '../components/UserCard.vue'
</script>

<style scoped>
.page {
  background-color: #f5f7fa;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.page-body {
  display: flex;
  flex: 1;
  gap: 24px;
  padding: 24px;
}

.sidebar {
  width: 260px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.side-nav {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  height: 44px;
  border-radius: 8px;
  padding: 0 16px;
  font-size: 14px;
  color: #666666;
  display: flex;
  align-items: center;
}

.nav-item--active {
  background-color: #eef2ff;
  color: #4f46e5;
  font-weight: 700;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-row {
  display: flex;
  gap: 16px;
}

.stat-card {
  flex: 1;
  background-color: #ffffff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-card__label {
  font-size: 13px;
  color: #888888;
}

.stat-card__value {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
}

.stat-card__change {
  font-size: 12px;
  color: #aaaaaa;
}

.stat-card__change--up {
  color: #16a34a;
}

.stat-card__change--down {
  color: #dc2626;
}

.section {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

.btn-text {
  font-size: 13px;
  color: #4f46e5;
  background-color: transparent;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.project-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background-color: #fafafa;
}

.project-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
}

.project-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.project-name {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a1a;
}

.project-desc {
  font-size: 12px;
  color: #aaaaaa;
}

.project-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 120px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background-color: #eeeeee;
}

.progress-fill {
  height: 6px;
  border-radius: 3px;
  background-color: #4f46e5;
}

.progress-text {
  font-size: 12px;
  color: #666666;
}

.project-deadline {
  font-size: 12px;
  color: #aaaaaa;
  width: 48px;
}
</style>
