<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { activeDialog, closeDialog } from '@/stores/dialog';
</script>
<template>
  <Dialog :open="!!activeDialog" @update:open="open => { if (!open) closeDialog(); }">
    <DialogContent v-if="activeDialog">
      <DialogHeader>
        <DialogTitle>{{ activeDialog.title }}</DialogTitle>
        <DialogDescription class="whitespace-pre-wrap break-words">{{ activeDialog.message }}</DialogDescription>
      </DialogHeader>
      <p v-if="activeDialog.detail" class="max-h-[55vh] overflow-auto whitespace-pre-wrap break-words text-sm text-muted-foreground">{{ activeDialog.detail }}</p>
      <DialogFooter>
        <Button v-for="button in activeDialog.buttons" :key="button.id" :variant="button.id === activeDialog.cancelId ? 'outline' : 'default'" :autofocus="button.id === activeDialog.defaultId" @click="closeDialog(button.id)">{{ button.label }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
