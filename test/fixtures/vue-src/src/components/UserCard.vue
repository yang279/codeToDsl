<template>
  <div class="user-card">
    <img class="card-avatar" src="/avatar.png" alt="avatar" />
    <div class="card-info">
      <span class="card-name">张三</span>
      <span class="card-role">产品设计师</span>
    </div>
    <div class="card-stats">
      <div class="stat-item">
        <span class="stat-value">32</span>
        <span class="stat-label">项目</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">128</span>
        <span class="stat-label">任务</span>
      </div>
    </div>
    <button class="btn-follow">关注</button>
  </div>
</template>

<script setup>
</script>

<style scoped>
.user-card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 24px;
  width: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.card-avatar {
  width: 72px;
  height: 72px;
  border-radius: 36px;
}

.card-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.card-name {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

.card-role {
  font-size: 13px;
  color: #888888;
}

.card-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}

.stat-label {
  font-size: 12px;
  color: #aaaaaa;
}

.btn-follow {
  width: 100%;
  height: 40px;
  background-color: #4f46e5;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  border-radius: 8px;
}
</style>
