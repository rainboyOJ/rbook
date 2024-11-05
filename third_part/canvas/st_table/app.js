const { createApp, ref ,reactive,computed} = Vue
function LOG2(n) {
  return Math.floor(Math.log2(n))
}
//根据数据生成f(i,j)
function init_st_table(arr) {
  let len = arr.length
  let maxK = LOG2(len)
  //产生数据
  let f = new Array(len+1)
  for (let i = 0; i < f.length;i++)
    f[i] = new Array(maxK+1).fill(undefined)
  // console.log(f)
  // 开始 计算
  for(let i = 0; i < len; i++)
    f[i+1][0] = arr[i] //注意这里f[i][0] 表示是 arr[i-1] 这个位置的值
  for(let k = 1; k <= maxK; k++) { //枚举长度
    for(let i = 0; i + (1<<k)-1 < len; i++){ // 枚举起点
      f[i+1][k] = Math.max(f[i+1][k-1],f[i+1+(1<<(k-1))][k-1])
    }
  }
  return f;
}

function random_int(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

createApp({
  setup() {
    let text_data = ref("9\n9 3 5 6 8 10 2 8 6")
    let query_txt = ref("")

    //注意这里是就1号为起点的
    let choosed_data = ref([0,0]) //选中的数据的起点与长度

    let data = computed(() => {
      let d = []
      let txt = text_data.value.split("\n")[1].trim().split(" ")
      for (let t of txt)
        d.push(parseInt(t))
      return d
    })

    /** 注意这里f(i,j) 表示的是 第i个元素,长度为2^j的最大值 */
    let f = computed(() => {
      let d = data.value
      let f = init_st_table(d)
      return f
    })

    //查询区间的最大值
    function query(){
      let [l,r] = query_txt.value.trim().split(" ").map(x => parseInt(x))
      console.log(l,r)
      if( !l || !r || l > r || l < 1 || r > data.value.length ) {
        alert("请输入正确的查询区间");
        return;
      }

      //区间长度
      let len = r - l + 1;
      let k = LOG2(len);
      let max_val_1 = f.value[l][k];
      let max_val_2 = f.value[r-(1<<k)+1][k];
      let max_val = Math.max(max_val_1,max_val_2);
      alert(`区间[${l},${r}]的最大值是${max_val},\n 用到的f(i,j)是f(${l},${k})->[${l},${l+(1<<k)-1}]\n f(${r-(1<<k)+1},${k}) ->[${r-(1<<k)+1},${r}]`);
    }


    function random_data() {
      let n = random_int(5, 15)
      let d = []
      for (let i = 0; i < n; i++) {
        d.push(random_int(1, 10))
      }
      text_data.value = (n+"\n") + d.join(" ")
    }

    function f_td_mouse_enter(i,j) {
      if( f.value[i][j] === undefined )
      {
        return;
      }
      choosed_data.value = [i,j]
    }

    function f_td_mouse_leave(i,j) {
      choosed_data.value = [0,0]
    }

    function is_choosed_in_f_table(i,j) {
      if( choosed_data.value[0] === 0 )  return false;
      if( f.value[i][j] === undefined ) return false;
      return choosed_data.value[0] === i && choosed_data.value[1] === j
    }

    //这里是判断 原数所data 中的元素是否被选中
    function is_choosed_in_data_array(idx){
      if( choosed_data.value[0] === 0 )  return false; //没有选中的f的元素
      if( idx < choosed_data.value[0] ) return false; //选中的f的元素 超出了data的范围
      if( idx >= choosed_data.value[0] + (1<<choosed_data.value[1]) ) return false; //选中的f的元素 超出了data的范围
      return true;
    }

    return {
      text_data,
      query_txt,
      data,
      f,
      f_td_mouse_enter,f_td_mouse_leave,
      choosed_data,
      is_choosed_in_f_table,
      is_choosed_in_data_array,
      random_data,
      query
    }

  }
}).mount('#app')
