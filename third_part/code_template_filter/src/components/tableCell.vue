<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue';
import { useToast } from "vue-toastification";

const toast = useToast()
const props = defineProps(['cell'])

const fetch_code = (cppFileUrl) => {
    return fetch('/code_template/' + cppFileUrl)
    .then(response => {
        // 检查响应状态是否成功
        if (response.ok) {
        // 获取响应体的 Blob 对象
        return response.text();
        } else {
        throw new Error('Failed to fetch the C++ file');
        }
    })
    //.then(blob => {
    //    // 创建一个临时的 URL 指向 Blob 对象
    //    const url = URL.createObjectURL(blob);

    //    // 创建一个 a 标签并设置 href 属性为临时 URL
    //    const link = document.createElement('a');
    //    link.href = url;
    //    link.setAttribute('download', 'file.cpp');

    //    // 将 a 标签添加到 DOM 中并触发点击事件
    //    document.body.appendChild(link);
    //    link.click();

    //    // 移除 a 标签并释放临时 URL
    //    document.body.removeChild(link);
    //    URL.revokeObjectURL(url);
    //})
    .catch(error => {
        alert('Error downloading C++ file:', error);
    });

}

const template_code_copy = () => {
    let code_url = props.cell.code
    //使用 fetch 下载代码
    fetch_code(code_url).then( code=> {
        //console.log(code)
        navigator.clipboard.writeText(code);
        toast.success('复制代码成功!')
    })
}

const view_code = () => {
    toast.info('view code TODO!')
}

const download_code = () => {
    toast.info('download code TODO!')
}

const copy_shell= () => {
    navigator.clipboard.writeText(props.cell.sh);
    toast.success('成功,请复制到终端里执行!')
}
</script>

<template>
  <div class="card shadow-sm g-col-lg-4 g-col-md-6 g-col-12">
      <div class="card-header d-flex justify-content-between align-items-center">
          {{props.cell.title}}
          <div class="btn-group" role="group" aria-label="Basic example">
            <a target="_blank" class="btn btn-sm btn-success" :href=" 'https://rbook.roj.ac.cn/' + props.cell.info.md_file.href">
                <Icon icon="solar:link-square-linear" height="20" width="20"/>
            </a>
            <button class="btn btn-sm btn-info" @click="view_code">
                <Icon icon="solar:eye-linear" height="20" width="20"/>
            </button>
            <button class="btn btn-sm btn-success" @click="download_code">
                <Icon icon="solar:download-linear" height="20" width="20"/>
            </button>
            <button class="btn btn-sm btn-warning" @click="template_code_copy">
                <Icon icon="solar:copy-linear" height="20" width="20"/>
            </button>
            <button v-if="props.cell.sh" class="btn btn-sm btn-primary" @click="copy_shell">
                <Icon icon="ion:terminal-outline" height="20" width="20"/>
            </button>
          </div>
      </div>
    <div class="card-body">
        {{ props.cell.desc || '无描述'}}
    </div>
    <div class="card-footer footer">
        <span v-for="tag in props.cell.tags" class="btn btn-outline-primary btn-sm">
            {{tag}}
        </span>
    </div>
  </div>
</template>

<style scoped>
.card {
    padding:0;
}
.card .footer {
    display:flex;
    justify-content:end;
    flex-wrap:nowrap;
    gap:5px;
}
.card:hover {
    box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.175) !important;
    background: rgba(0,0,0,0.05);
}
</style>
