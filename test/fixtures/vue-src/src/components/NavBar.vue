<template>
  <nav class="navbar">
    <div class="navbar-brand">
      <img class="brand-logo" src="/logo.png" alt="logo" />
      <span class="brand-name">WorkSpace</span>
    </div>

    <div class="navbar-menu">
      <router-link class="menu-item" to="/dashboard">首页</router-link>
      <router-link class="menu-item" to="/projects">项目</router-link>
      <router-link class="menu-item" to="/team">团队</router-link>
    </div>

    <div class="navbar-actions">
      <button class="btn-notify">通知</button>
      <div class="avatar-wrap">
        <img class="user-avatar" src="/avatar.png" alt="avatar" />
      </div>
    </div>
  </nav>
</template>

<script setup>
</script>

<style scoped>
.navbar {
  width: 100%;
  height: 64px;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
}

.brand-name {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
}

.navbar-menu {
  display: flex;
  align-items: center;
  gap: 32px;
}

.menu-item {
  font-size: 14px;
  font-weight: 400;
  color: #666666;
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-notify {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background-color: #f5f5f5;
  color: #666666;
  font-size: 14px;
}

.avatar-wrap {
  width: 36px;
  height: 36px;
  border-radius: 18px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 18px;
}
</style>
