## 能过暴力的方式求一下 a^m = a mod m

def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n**0.5)+1):
        if n % i == 0:
            return False
    return True


while True:
    m = int(input("请输入一个素数m："))
    if is_prime(m):
        break;
    else:
        print("输入的不是素数，请重新输入！")

for a in range(1, m):
    a_pow_m = a**m
    a_pow_m_mod_m = a_pow_m % m
    print(f"{a}^{m} = {a_pow_m} mod {m} = {a_pow_m_mod_m}")