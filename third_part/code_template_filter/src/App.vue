<script setup>
import {inject,ref,computed} from 'vue'
import { useToast } from "vue-toastification";
import HelloWorld from './components/HelloWorld.vue'
import tableCell from './components/tableCell.vue'
import Fuse from 'fuse.js'

const template_array = inject('template_array')
const search_text = ref("")
const toast = useToast()

const FuseOptions = {
	// isCaseSensitive: false,
	// includeScore: false,
	// shouldSort: true,
	// includeMatches: false,
	// findAllMatches: false,
	// minMatchCharLength: 1,
	// location: 0,
	// threshold: 0.6,
	// distance: 100,
	// useExtendedSearch: false,
	// ignoreLocation: false,
	// ignoreFieldNorm: false,
	// fieldNormWeight: 1,
	keys: [
		"title"
	]
}

const fuse = new Fuse(template_array,FuseOptions)

const search_func = () => {
    console.log(search_text.value)
    if(search_text.value.length == 0) {
        toast.warning("请输入内容!")
        return;
    }
    toast.info("TODO,等待完成!")
    let ret = fuse.search(search_text.value);
    console.log(ret)
}

const search_result = computed(
    () =>{
        if( search_text.value.length == 0)
            return template_array
        else
            return fuse.search(search_text.value);
    }
)
</script>

<template>
    <div class="container py-4 px-3 mx-auto">
        <div class="row mb-5">
            <div class="input-group flex-nowrap">
                <span class="input-group-text" id="addon-wrapping">搜索</span>
                <!-- <input @keydown.enter="search_func"  v-model="search_text" type="text" class="form-control" placeholder="请输入内容" aria-label="search" aria-describedby="addon-wrapping"> -->
                <input  v-model="search_text" type="text" class="form-control" placeholder="请输入内容" aria-label="search" aria-describedby="addon-wrapping">
            </div>
        </div>

        <!-- {{template_array}} -->
        <div class="grid gap-2">
            <tableCell :cell="d.item || d" v-for="d in search_result"/>
        </div>
    </div>
</template>

<style scoped>
</style>
