
TODO: 带学生使用小学生法解一遍题目

数据 生成程序

```
int a[100];
int n = rnd(1,5);
int m = 1;
cout << n << " " << 1 << endl;
for(int i=1;i<=n;i++) {
    a[i] = rnd(1,10);
}
sort(a+1,a+1+n);
for(int i=1;i<=n;i++) {
    cout << a[i] << " ";
}
cout << "\n";
cout << rnd(1,13);
```


教学