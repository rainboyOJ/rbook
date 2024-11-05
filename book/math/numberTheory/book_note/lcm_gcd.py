from random import randint
from math import gcd, lcm
from tabulate import tabulate
# 最简单的思想,一点一点向上增长,直到能整除为止.

data = []
for i in range(1, 11):
    a = randint(1, 30)
    b = randint(1, 30)
    #format_str = "a = {}, b = {}, lcm(a, b) = {},gcd(a, b) = {}, lcm(a, b) * gcd(a, b) = {} = a * b"
    #print(format_str.format(a,b,lcm(a,b),gcd(a,b),a*b))
    data.append([a,b,lcm(a,b),gcd(a,b),a*b])
headers = ["a","b","lcm(a,b)","gcd(a,b)","a*b" ]
table = tabulate(data,headers=headers,tablefmt='grid' ) 
print(table)
