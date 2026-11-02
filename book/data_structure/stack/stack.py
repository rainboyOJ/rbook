# 直接使用 list 模拟栈
stack = []

stack.append(1)   # 入栈 push
top = stack[-1]   # 查看栈顶 peek → 3
item = stack.pop()  # 出栈 pop → 3

is_empty = not stack          # 判空
size = len(stack)             # 大小

## 方法2 : 继承 list,改名
class Stack(list):
   push = list.append
   empty = lambda self: not self
   size = lambda self: len(self)


#  使用 class 封装，便于扩展和加保护 

class Stack:
   def __init__(self):
       self._items = []

   def push(self, item):
       self._items.append(item)

   def pop(self):
       if self.is_empty():
           raise IndexError("pop from empty stack")
       return self._items.pop()

   def peek(self):
       if self.is_empty():
           raise IndexError("peek from empty stack")
       return self._items[-1]

   def is_empty(self) -> bool:
       return not self._items

   def __len__(self) -> int:
       return len(self._items)

   def __repr__(self):
       return f"Stack({self._items})"


s = Stack()
s.push(1); s.push(2)
print(s.peek())   # 2
print(s.pop())    # 2
print(len(s))     # 1
