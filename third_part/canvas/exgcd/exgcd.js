var a = 12
var b = 8

var exgcd_info = []


//返回值[gcd,x,y]
// gcd 最在公约数
// x,y 一组解
function exgcd(a,b,dep) {
    //清空
    if( dep == 1 ) {
        exgcd_info = [0]
    }
    exgcd_info.push({a,b,x:0,y:0})
    if(b == 0)  {
        exgcd_info.push({a,b,x:1,y:0})
        return [a,1,0];
    }
    let [gcd,x,y] = exgcd(b, a % b ,dep+1);
    let x0 = y
    let y0 = x-Math.floor(a*y/b)
    exgcd_info[dep].x = x0
    exgcd_info[dep].y = y0
    return [gcd,x0,y0]
}

let ans = exgcd(a,b,1);
console.log(ans)
console.log(exgcd_info)
