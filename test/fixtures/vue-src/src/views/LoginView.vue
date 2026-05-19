<template>
  <div class="page">
    <div class="login-card">
      <div class="login-title">欢迎回来</div>
      <div class="login-subtitle">请输入账号和密码登录</div>

      <div class="form-group">
        <label class="form-label">邮箱</label>
        <input class="form-input" type="email" placeholder="请输入邮箱" />
      </div>

      <div class="form-group">
        <label class="form-label">密码</label>
        <input class="form-input" type="password" placeholder="请输入密码" />
      </div>

      <button class="btn-submit" @click="handleLogin">登录</button>

      <div class="login-footer">
        <span>还没有账号？</span>
        <router-link class="link-register" to="/register">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const email = ref('')
const password = ref('')

function handleLogin() {
  console.log('login', email.value, password.value)
}
</script>

<style scoped>
.page {
  background-color: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.login-card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 40px 32px;
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
}

.login-subtitle {
  font-size: 14px;
  color: #888888;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 14px;
  font-weight: 700;
  color: #333333;
}

.form-input {
  height: 44px;
  border-radius: 8px;
  font-size: 14px;
  color: #1a1a1a;
  background-color: #f7f8fa;
  padding: 0 12px;
}

.btn-submit {
  width: 100%;
  height: 48px;
  background-color: #4f46e5;
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  border-radius: 8px;
}

.login-footer {
  display: flex;
  justify-content: center;
  gap: 4px;
  font-size: 14px;
  color: #888888;
}

.link-register {
  font-size: 14px;
  font-weight: 700;
  color: #4f46e5;
}
</style>
