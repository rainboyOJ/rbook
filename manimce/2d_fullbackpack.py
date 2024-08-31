from manim import *
n = 5 # 物品的数量
m = 7 # 背包的容量
items_weight = [6, 5,2, 4,2] # 物品的重量
items_value = [5, 4, 3,6,6] # 物品的价值

# 最终的值
f = [[0 for j in range(m+1)] for i in range(n+1)]

# config.frame_width = 16
# config.frame_height = 9
# config.background_color = GREEN



class fullbackpack_2d(Scene):
    def construct(self):
        # plane = NumberPlane()
        # self.add(plane)
        # self.wait(1)
        formula =  MathTex(r'''
                      f(i,j)=\left\{
                           \begin{array}{ll}
                           0 & \text{if } i=0 \lor j=0 \\
                           \max\{f(i-1,j),f(i,j-w_i)+v_i\} & \text{otherwise}
                           \end{array}
                      \right.
                      ''').scale(0.8)
        self.play(Write(formula))
        # self.add(index_labels(formula[0]))
        self.wait(0.5)
        self.play(formula.animate.to_edge(UP))

        box = SurroundingRectangle(formula)
        def light_formula_animate(choose_left=True):
            a,b = BLUE,WHITE
            global box
            box = SurroundingRectangle(formula[0][22:30],color=a)
            if not choose_left:
                a ,b = WHITE,BLUE
                box = SurroundingRectangle(formula[0][31:43],color=b)
            return [ formula[0][22:30].animate.set_color(a),formula[0][31:43].animate.set_color(b)
            ,Create(box)]
        
        def de_light_formula_animate(choose_left=True):
            global box
            return [FadeOut(box),formula[0][22:30].animate.set_color(WHITE),formula[0][31:43].animate.set_color(WHITE)]

        # self.play(*light_formula_animate(False))
        # self.wait(1)
        # self.play(*de_light_formula_animate(False))
        # self.wait(1)
        # self.play(*light_formula_animate(True))
        # self.wait(1)
        # self.play(*de_light_formula_animate(False))
        # self.wait(1)
        # return

        # 创建物品
        item_text = VGroup(Text("W V",font="FiraCode Nerd Font"), *[Text(f"{w} {v}",font="FiraCode Nerd Font") for w,v in zip(items_weight,items_value)])
        item_text.arrange(DOWN, buff=0.2)
        item_text.move_to(ORIGIN)
        self.play(Write(item_text))
        self.play(item_text.animate.to_edge(LEFT))
        # return ;

        
        
        # 设置每个矩形的大小和间距
        rect_width = 0.8
        rect_height = 0.8
        rect_spacing = 0.2
        
        # 创建一个 VGroup 来存储所有矩形
        vg = VGroup()
        
        # 遍历矩阵并创建矩形
        for i in range(n+1):
            rect_group = VGroup( *[ Rectangle(width=rect_width, height=rect_height,color=None ,stroke_color=WHITE,fill_opacity=0.5) for _ in range(m+1) ])
            rect_group.arrange(RIGHT, buff=rect_spacing)
            # rect_group.move_to(DOWN*i)
            # self.play(Create(rect_group))
            vg.add(rect_group)
        
        # 将 VGroup 添加到场景中
        vg.arrange(DOWN, buff=rect_spacing)
        vg.move_to(ORIGIN).move_to(DOWN)
        self.play(Create(vg))
        self.wait(1)
        # return ;

        # 创建下标
        index_labels = VGroup()
        # 容量
        index_labels.add( *[MathTex(str(i)).next_to(vg[0][i],UP) for i in range(m+1)])
        index_labels.add( *[MathTex(str(i)).next_to(vg[i][0],LEFT) for i in range(n+1)])
        self.play(Write(index_labels))
        


        # 填充矩阵0
        text_group = VGroup()
        for i in range(n+1):
            t_group = VGroup()
            for j in range(m+1):
                tt = MathTex("0")
                tt.move_to(vg[i][j].get_center())
                t_group.add(tt)
            text_group.add(t_group)
        self.play(Write(text_group))


        # 创建[i][j] [x][y] 两个矩形的之间的连线
        def create_arrow(i,j,x,y):
            a = vg[i][j].get_top()
            b = vg[x][y].get_bottom()
            arrow = Arrow(a, b, buff=0, color=RED)
            self.play(Create(arrow))
        

        # 选择前一个状态的时候，高亮某个矩形
        def light_rect_animate(i,j,y2,color1,color2,color3):
            arr = []
            arr.append(vg[i][j].animate.set_fill(color1))
            if i-1 >= 0:
                arr.append( vg[i-1][j].animate.set_fill(color2) )
            if y2 is not None and y2 >= 0:
                arr.append( vg[i-1][y2].animate.set_fill(color3) )
            return arr

        # 高亮某个物品的数据
        def light_item(i) :
            w = items_weight[i-1]
            v = items_value[i-1]
            text = MarkupText(f'<span underline="single" underline_color="green" fgcolor="{BLUE}">{w} {v}</span>').move_to(item_text[i].get_center())
            self.play(Transform(item_text[i], text))
        def de_light_item(i) :
            w = items_weight[i-1]
            v = items_value[i-1]
            text = Text(f'{w} {v}',font="FiraCode Nerd Font",color=GRAY).move_to(item_text[i].get_center())
            self.play(Transform(item_text[i], text))

        
        for i in range(1, n+1):
            light_item(i)
            for j in range(1, m+1):
                ## 绘制从a点到b点的箭头

                # 得到vg[i][j]上边的中间的点的坐标

                v = items_value[i-1]
                w = items_weight[i-1]
        

                ## 选中的前一个状态是GREEN
                if j >= items_weight[i-1]:
                    if f[i-1][j] > f[i][j-w] + v:
                        f[i][j] = f[i-1][j]
                        self.play(*light_rect_animate(i,j,None,BLUE,GREEN,GRAY_BROWN),*light_formula_animate(True))
                    else:
                        f[i][j] = f[i][j-w] + v
                        self.play(*light_rect_animate(i,j,j-w,BLUE,GRAY_BROWN,GREEN),*light_formula_animate(False))
                    self.wait(0.5)
                    new_text = MathTex(str(f[i][j])).move_to(vg[i][j].get_center())
                    self.play(Transform(text_group[i][j], new_text))
                    self.play(*light_rect_animate(i,j,j-items_weight[i-1],WHITE,WHITE,WHITE),*de_light_formula_animate(False))
                else:
                    self.play(*light_rect_animate(i,j,None,BLUE,GREEN,GRAY_BROWN),*light_formula_animate(True))
                    self.wait(0.5)
                    f[i][j] = f[i-1][j]
                    new_text = MathTex(str(f[i][j])).move_to(vg[i][j].get_center())
                    self.play(Transform(text_group[i][j], new_text))
                    self.play(*light_rect_animate(i,j,j-items_weight[i-1],WHITE,WHITE,WHITE),*de_light_formula_animate(False))
            de_light_item(i)
