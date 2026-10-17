<script setup lang="ts">import { computed, ref, watch } from 'vue';
import { Loader2, LockKeyhole, User } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSession } from '@/stores/session';
const session = useSession();
const username = ref(session.state.rememberedUsername ?? '');
const password = ref('');
const remember = ref(Boolean(session.state.rememberedUsername));
watch(() => session.state.rememberedUsername, (value) => {
    if (value && !username.value) {
        username.value = value;
        remember.value = true;
    }
});
const canSubmit = computed(() => username.value.trim().length > 0 && password.value.length > 0);
const errorMessage = computed(() => session.state.error);
async function submit(): Promise<void> {
    if (!canSubmit.value || session.state.submitting)
        return;
    const ok = await session.login(username.value, password.value, remember.value);
    if (ok)
        password.value = '';
}
</script>

<template>
  <div class="flex min-h-full items-center justify-center p-6">
    <div class="w-full max-w-sm">
      <div class="mb-6 flex flex-col items-center gap-2 text-center">
        <img src="/logo.png" class="size-12 rounded-xl" alt="XMOJ" />
        <h1 class="text-lg font-semibold">登录小明的 OJ</h1>
        <p class="text-sm text-muted-foreground">
          使用你的 xmoj.tech 账号登录以查看题库与评测记录
        </p>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <div class="space-y-2">
          <label class="text-sm font-medium" for="login-username">用户名（学号）</label>
          <div class="relative">
            <User
              class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="login-username"
              v-model="username"
              class="pl-9"
              placeholder="请输入用户名"
              autocomplete="username"
              :disabled="session.state.submitting"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium" for="login-password">密码</label>
          <div class="relative">
            <LockKeyhole
              class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="login-password"
              v-model="password"
              class="pl-9"
              type="password"
              placeholder="请输入密码"
              autocomplete="current-password"
              :disabled="session.state.submitting"
            />
          </div>
        </div>

        <label class="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            v-model="remember"
            type="checkbox"
            class="size-4 rounded border-input accent-primary"
            :disabled="session.state.submitting"
          />
          记住密码（由系统密钥库加密保存）
        </label>

        <p
          v-if="errorMessage"
          class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {{ errorMessage }}
        </p>

        <Button type="submit" class="w-full" :disabled="!canSubmit || session.state.submitting">
          <Loader2 v-if="session.state.submitting" class="animate-spin" />
          {{ session.state.submitting ? '登录中…' : '登录' }}
        </Button>
      </form>

      <p class="mt-4 text-center text-xs text-muted-foreground">
        密码通过 HTTPS 提交至
        <span class="font-mono">www.xmoj.tech/login.php</span>
      </p>
    </div>
  </div>
</template>
