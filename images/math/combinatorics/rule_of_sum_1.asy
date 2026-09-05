unitsize(1cm);
real a = 2; // 椭圆半长轴
real b = 1; // 椭圆半短轴
pair bcenter = (-2.5,0);
pair ccenter = (2.5,0);
pair acenter = (0,3);

label("$B$",bcenter);
label("$C$",ccenter);
label("$A$",acenter);

path ab = bcenter -- acenter;
path ac = ccenter -- acenter;

path circle_a = circle(acenter,0.2);

path B = ellipse(bcenter, a, b);
path C = ellipse(ccenter, a, b);

pair B_intersect  = point(B,times(B,bcenter.x)[0]);
pair C_intersect = point(C,times(C,ccenter.x)[0]);
path circle_with_a = point(circle_a,intersect(circle_a,ab)[0]);
path circle_with_b = point(circle_a,intersect(circle_a,ac)[0]);
// 计算两点连线的单位向量
draw( circle_with_a -- B_intersect,Arrow,margin=DotMargins);
draw( circle_with_b -- C_intersect,Arrow,margin=DotMargins);


draw(B);
draw(C);



