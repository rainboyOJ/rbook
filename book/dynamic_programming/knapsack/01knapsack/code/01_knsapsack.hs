-- 处理一个item , 根据上一行状态生成新的一行状态
-- 参数
-- 1. items
-- 2 f 数组
-- 返回 3 f 数组
deal_one :: [Int] -> (Int,Int) -> [Int]
deal_one f (w,v)  = [ step x  | x <- [0.. c]]
    where 
        c = length f - 1
        step i = if i < w then (f !! i) else max (f !! (i-w) + v) (f !! i)

main = do
    let n = 5
    let c = 7
    let items = [last),(2,3),(6,5),(5,4),(4,6)]
    let f = [ 0 | x <- [0..c]]
    let ans = foldl deal_one f items
    -- print $ deal_one f ( items !! 0) 
    print $ last ans
