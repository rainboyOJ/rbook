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
  items_index_set =  _.flatMap(items_index_set, (idx) => Array.from({ length: Math.floor( capacity / items[idx].weight) }).fill(idx)) 
  console.log(items_index_set)

  const powerSet = _.chain(items_index_set)
  .thru(  items_set =>
    items_set.reduce(
        (acc, item) => acc.concat( acc.map(subset => [...subset,item ])
  ), [[]])
  .filter( arr => _.sumBy(arr, (index)=> items[index].weight ) <= capacity )
  // .filter( arr => _.sum(arr) <= capacity )
  // .map( arr => "(" + arr.join(',') +  ")")
  // .map( arr =>  _.sumBy(arr, (index)=> items[index].weight) )
  ) // 生成幂集
  .value();
  return powerSet

}

// 得到f数组
function get_f_set(items,items_cnt,capacity) {
    console.log('-->',items_cnt,capacity)
    //创建f数组 n+1行,m+1列
    // let f = _.times(items_cnt+1,() => _.times(capacity+1 ,()=> 0) )
    let f = []
    for(let i = 0 ;i<=items_cnt;i++) {
        // f.push( Array.from({length:capacity+1}).fill(0) )
        // f.push([0,0,0])
        // for(let j =0 ;j<=capacity;j++)
        let t = []
        for(let j = 0 ;j <= capacity ;j++)
            t.push(0)
        f.push(t)
    }
    // console.log('->',f)
    // console.log('capacity',capacity)
    // console.log('->',f)
    //
    //枚举物品
    for(let i = 1;i<=items_cnt;i++){
        let w = items[i-1].weight
        let v = items[i-1].value
        for(let j = 0;j<=capacity;j++)
        {
            f[i][j] = f[i-1][j];
            if( j < w || f[i][j-w] + v < f[i][j]) continue;
            f[i][j] = f[i][j-w] + v;
        }
    }
    return f;
}

const { createApp, ref ,reactive,computed} = Vue

createApp({
  setup() {

    //物品
    var items = ref([
      { weight: 6, value: 5 },
      { weight: 5, value: 4 },
      { weight: 2, value: 3 },
      { weight: 4, value: 6 },
      { weight: 2, value: 6 }
    ]);

    //正在active的f_td cell
    var f_td_active = ref([-1,-1])

    var capacity = ref(7);
    var capacity_choose = ref(7);
    const items_cnt = ref(items.value.length)
    const validSet = computed( ()=> {
      return get_fit_set(items.value,items_cnt.value,capacity_choose.value)
    })

    const fSet = computed( ()=> {
      return get_f_set(items.value,items_cnt.value,capacity_choose.value)
    })

    function f_td_mouse_enter(i,j) {
        console.log(i,j)
        f_td_active.value[0] = i;
        f_td_active.value[1] = j;
    }

    function f_td_mouse_leave(i,j) {
        f_td_active.value[0] = -1;
        f_td_active.value[1] = -1;
    }


    function is_active(i,j) {
        return i == f_td_active.value[0] && j == f_td_active.value[1];
    }

    //当前位置的to的位置是不是 f_td_active 的前趋?
    // 0 不是
        //  1 是前趋,但不是转移点
        //  2 是前趋,是转移点
    function is_f_pre(i,j) {
        if( i < 0 || j < 0) return 0;
            //上一行
        if( i == f_td_active.value[0]-1 && j == f_td_active.value[1]  )
        {
            if( fSet.value[i][j] == fSet.value[f_td_active.value[0]  ][f_td_active.value[1] ])
                return 2;
            else
                return 1;
        }

            // i - 1 是这个物品的编号
        if( i == f_td_active.value[0] && f_td_active.value[1] - items.value[i-1].weight == j)
        {
            if( fSet.value[i][j] + items.value[i-1].value == fSet.value[f_td_active.value[0]  ][f_td_active.value[1] ])
                return 2;
            else
                return 1;
        }

        return 0;
    }

    return {
      items_cnt,
      items,
      capacity,
      capacity_choose,
      validSet,
            fSet, is_f_pre,f_td_mouse_enter,f_td_mouse_leave,is_active
    }
  }
}).mount('#app')
