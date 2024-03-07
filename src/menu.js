const { join } = require("path")
const ejs = require("ejs")
const { get_ejs_template, srcp } = require("./lib/utils.js")

const li_item = get_ejs_template("li_item.html")
//左侧的菜单
const menu = [
    {
        title: '前言',
        path: "introducation/",
    },
    {
        title: "基础",
        path: "base",
        child: [
            { title: "平数", path: "zero_number" },
            { title: "前缀和", path: "presum" },
            { title: "差分", path: "差分" },
            { title: "双指针", path: "two-pointer" },
            { title: "排序不等于式", path: "rearrangement_inequality" }
        ]
    },
    {
        title: "递归",
        path: "recursion",
        child: [
            {
                title: "前言",
                path: "preface.md"
            },
            {
                title: "1加到n",
                path: "add_to_n"
            },
            {
                title: "输出1到n",
                path: "print_to_n"
            },
            {
                title: "斐波那契数列",
                path: "fibonacci"
            },
            {
                "title": "汉诺塔",
                path:"hanoi"
            },
            {
                title: "整数划分",
                path: "div_number"
            },
            {
                title: "二分查找",
                path: "binary_search/"
            },
            {
                title:"题目",
                path:"practice.md"
            }
        ]
    },
    {
        title: "枚举与排列组合",
        path: "enumeration_permutaion_combination/",
        child: [
            {
                title: "01_sequence",
                path: "01_sequence/index.md"
            },
            {
                title: "球放盒子模型",
                path:"box_and_ball"
            },
            {
                title:"出栈序列",
                path:"stack_seq"
            },
            {
                title: "排列",
                path: "permutation",
                child: [
                    {
                        title: "全排列",
                        path: "full_permutation/index.md"
                    },
                    {
                        title: "不重复排列",
                        path: "not_repeat_permutation/index.md"
                    }
                ]
            }
        ]
    },
    {
        title: "搜索",
        path: "search",
        child: [
            {
                title: "深度优先搜索",
                path: "dfs",
                child: [
                    {
                        title: "序",
                        path: 'index.md'
                    }
                ]
            }
        ]
    },
    {
        title: "动态规划",
        path: "dynamic_programming",
        child: [
            {
                title:"入门",
                path:"number_pyramid"
            },
            {
                title: "线性DP",
                path: "",
                child: [
                    { title: "LIS", path: "lis" },
                    { title: "LCS", path: "lcs" }
                ]
            },
            {
                title: "背包",
                path: "knapsack",
                child: [
                    {
                        title: "习题1: 整数划分",
                        path: "exercises/整数划分/problem.md"
                    }
                ]
            },

        ]
    },
    {
        title:"图",
        path:"graph",
        child:[
            { "title":"前言", path:"preface.md" },
            { "title":"存储", path:"save" },
            { "title":"遍历", path:"traversal" },
        ]
    },
    {
        title: "数据结构",
        path: "data_structure",
        child: [
            { title: "栈", path: "stack" },
            { title: "队列", path: "queue" },
            { title: "单调队列", path: "monotonic_queue" },
        ]

    },
    {
        title:"工具库",
        path:"utils",
        child:[
            {title:"log",path:"log.md"}
        ]
    },
    {
        title: "数学",
        path: "math",
        child: [
            {
                title: "进制",
                path: "binary"
            },
            {
                title: "对数",
                path: "logarithm",
            },
            {
                title: "组合",
                path: "combinatorics",
                child: [
                    { title: "分类加法", path: "rule_of_sum" },
                    { title: "分步乘法", path: "rule_of_product" },
                    { title: "组合数学", path: "combinatorics" },
                    { title: "catalan数", path: "catalan_number" },
                ]
            },
            {
                title: "数论",
                path: "numberTheory",
                child: [
                    { title: "整除", path: "divisible" },
                    { title: "余数", path: "remainder" },
                    { title: "素数", path: "prime" },
                    { title: "gcd", path: "gcd" }
                ]
            }
        ]

    },
    {
        title: "附录",
        path: "appendix",
        child: [
            {
                title: "软件",
                path: 'SoftWare',
                child: [
                    { title: 'vscode', path: 'vscode' },
                    { title: 'cgdb', path: 'cgdb' },
                    { title: 'pure-ftpd', path: 'pure-ftpd' },
                    { title: '在线工具', path: 'online.md' },
                    { title: 'neovim', path: 'neovim' }
                ]
            },
            {
                title: "脚本",
                path: 'shellScripts',
                child: [
                    { title: "编译", path: "compile" },
                    { title: "对拍", path: "compare" },
                    { title: "有用命令", path: "usefull" },
                    { title: "有趣命令", path: "funny_command" }
                ]

            },
            {
                title:"技巧",
                path:"tricks",
                child:[
                    {title:"解题步骤",path:"stepofSolve"},
                    {title:"代码模板",path:"template"},
                ]
            },
            {
                title: "python",
                path: "python.md"
            },
            {
                title: "编程常用单词",
                path: "编程常用单词.md"
            },
        ]
    }
]

// 把menu数据转成 ul > li 数据
function menu_to_ul_list(parent_path, data) {
    let html = ''
    if (Array.isArray(data)) { //是数组
        html += '<ul>\n'
        for (let d of data) {
            html += menu_to_ul_list(parent_path, d)
        }
        html += '</ul>\n'
    }
    else { // 不是数组,那就是一个item,转成li
        let ul = ''
        let cp = join(parent_path, data.path)
        if (data.child)
            ul = menu_to_ul_list(cp, data.child)
        html = li_item({ ...data, ul, link: cp })
    }
    return html;
}

exports.menu_html = menu_to_ul_list('/', menu)
// console.log(menu_html)

// 把menu数据flatten
// [path1,path2,path3,...]
function _flatten_menu(parent_path, resolve, data) {
    let arr = []

    if (Array.isArray(data)) { //是数组
        for (let d of data) {
            arr = arr.concat(_flatten_menu(parent_path, resolve, d))
        }
    }
    else { // 不是数组,那就是一个item,转成li
        let path = join(parent_path, data.path)
        let resolve_path = join(resolve, data.path)
        if (data.child)
            arr = arr.concat(_flatten_menu(path, resolve_path, data.child))
        else
            arr.push(resolve_path)
    }
    return arr;
}

// [ resolve-path1,...]
exports.flatten_menu = _flatten_menu(srcp, '', menu)

