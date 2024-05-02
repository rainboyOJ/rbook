<script setup>
import {inject,ref} from 'vue'
import { useToast } from "vue-toastification";
import HelloWorld from './components/HelloWorld.vue'
import tableCell from './components/tableCell.vue'

const template_array = inject('template_array')
const search_text = ref("")
const toast = useToast()

const search_func = () => {
    console.log(search_text.value)
    if(search_text.value.length == 0) {
        toast.warning("请输入内容!")
        return;
    }
    toast.info("TODO,等待完成!")

}
</script>

<template>
    <div class="container py-4 px-3 mx-auto">
        <div class="row mb-5">
            <div class="input-group flex-nowrap">
                <span class="input-group-text" id="addon-wrapping">搜索</span>
                <input @keydown.enter="search_func"  v-model="search_text" type="text" class="form-control" placeholder="请输入内容" aria-label="search" aria-describedby="addon-wrapping">
            </div>
        {{search_text}}
        </div>

        <!-- {{template_array}} -->
        <div class="grid gap-2">
            <tableCell :cell="d" v-for="d in template_array"/>
        </div>
    </div>
</template>

<style scoped>
</style>
