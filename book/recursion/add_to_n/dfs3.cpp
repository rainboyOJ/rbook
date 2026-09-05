#include <iostream>
using namespace std;

int n; 
int calc(int a,int s)           
{                               
    if( a == n+1)               
        return s;               
    return calc(a + 1, s + a);  
} 
int main()             
{                       
    n = 2; 
    int ans = calc(1,0); 
    cout << ans << endl;
    return 0;
}