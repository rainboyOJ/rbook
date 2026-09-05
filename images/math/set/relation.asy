unitsize(1cm); // 设置单位尺寸
label("hello");

// // 定义两个圆心和半径
// pair A = (-2, 0);
// pair B = (2, 0);
// real r = 1.5;

// // 绘制两个圆
// draw(circle(A, r));
// draw(circle(B, r));

// // 绘制文字标签
// label("$A$", A);
// label("$B$", B);

// // 绘制集合的关系（交集、并集等）
// label("$A \cap B$", (0, 0.4));
// label("$A \cup B$", (0, -1.8));

// // 填充集合区域
// fill(scale(0.6)*unitcircle, lightblue); // 填充 A 的区域
// fill(shift(B) * scale(0.6) * unitcircle, lightblue); // 填充 B 的区域

// // 交集
// fill(buildcycle(circle(A, r), shift(B) * circle(B, r)), lightred);

// // 边界
// draw(scale(0.6) * unitcircle);
// draw(shift(B) * scale(0.6) * unitcircle);

// // 可选：画边框
// draw(circle(A, r),linewidth(1.2));
// draw(circle(B, r),linewidth(1.2));

// // 如果需要更多的自定义，你可以添加更多的元素或调整颜色、字体等
