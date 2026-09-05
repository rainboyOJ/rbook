#!/usr/bin/env python
from functools import reduce
from itertools import *
from random import randint

def iter2str(iter):
    return " ".join(map(str,iter))

n = randint(5,5)
m = randint(1,3)
print(n,m)
print(iter2str([randint(1,9) for i in range(0,n)]))
# print(" ".join(["0"]*n))
for i in range(0,m):
    o = randint(1,2)
    if o == 1:
        x = randint(1,n)
        y = randint(-100,100)
        print(o,x,y)
    else:
        x = randint(1,n)
        y = randint(x,n)
        print(o,x,y)
