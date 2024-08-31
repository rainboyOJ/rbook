//全局变量




var slider_items
var slider_capacity

function setup() {
  // const Sa_input = createInput(stra)
  // const Sb_input = createInput(strb)
  createCanvas(800, 600);
  // textAlign(CENTER,CENTER)
  // textSize(16)

  slider_capacity = createSlider(0, capacity,capacity);
  slider_capacity.position(100, 40);
  slider_capacity.size(100)

  slider_items = createSlider(0, items.length, items.length);
  slider_items.position(400, 40);
  slider_items.size(100)

}


//得到适合的集合
// 参数 
// items : 
// items_cnt
// capacity
function get_fit_set(items,items_cnt,capacity) {
  if( items_cnt > items.length) {
    alert(`错误,选把的前${items_cnt}个物品,超过了总物品的数量${items.length} !`)
    return;
  }

  let items_index_set = Array.from( {length: items_cnt}, (_,i)=> i);

  //因为是完全背包,所以这里生成了新的集合,每个物品有多少个
  // items_index_set =  _.flatMap(items_index_set, (idx) => Array.from({ length: Math.floor( capacity / items[idx].weight) }).fill(idx)) 

  const powerSet = _.chain(items_index_set)
  .thru(  items_set =>
    items_set.reduce(
        (acc, item) => acc.concat( acc.map(subset => [...subset,item ])
  ), [[]])
  //过滤出 just fill it up 的组合
  .filter( arr => _.sumBy(arr, (index)=> items[index].weight ) == capacity )
  ) // 生成幂集
  .value();
  return powerSet

}

//生成对应的f结果
function get_f_set(items,items_cnt,capacity) {
  f = []
  for(let i = 0;i<=items_cnt;i++) {
    f.push([])
    for(let j = 0 ;j<=capacity;j++) {
      f[i].push(-1) //-1 表示不可能
    }
  }
  f[0][0] = 0;
    //枚举物品
    for(let i  =1;i<=items_cnt;i++) {
        let w = items[i-1].weight;
        let v = items[i-1].value;
        f[i][0] = 0;
        for(let j = w; j<=capacity;j++)
        {
            f[i][j] = f[i-1][j];
            if(f[i-1][j-w] !=-1  && f[i][j] < f[i-1][j-w] + v)
                f[i][j] = f[i-1][j -w] + v;
        }
    }
  return f;
}

const { createApp, ref ,reactive,computed} = Vue

createApp({
  setup() {

    //物品
    var items = ref([
      { weight: 5, value: 8 },
      { weight: 3, value: 4 },
      { weight: 1, value: 3 },
      { weight: 2, value: 5 },
      { weight: 4, value: 6 }
    ]);

    var capacity = ref(7);
    var capacity_choose = ref(7);
    const items_cnt = ref(items.value.length)
    const validSet = computed( ()=> {
      return get_fit_set(items.value,items_cnt.value,capacity_choose.value)
    })

    //结果集合
    const fSet = computed( ()=> {
      return get_f_set(items.value,items_cnt.value,capacity_choose.value)
    })

    return {
      items_cnt,
      items,
      capacity,
      capacity_choose,
      validSet,
      fSet
    }
  }
}).mount('#app')
