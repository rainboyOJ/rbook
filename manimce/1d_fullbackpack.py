# 01背包一维

from manim import *
n = 5 # 物品的数量
m = 7 # 背包的容量
items_weight = [ 6, 5,2, 4,2] # 物品的重量
items_value = [ 5, 4, 3,6,6] # 物品的价值

# 最终的值
f = [0 for j in range(m+1)]

# config.frame_width = 16
# config.frame_height = 9
# config.background_color = GREEN



class fullbackpack_1d(Scene):
    def construct(self):
        # plane = NumberPlane()
        # self.add(plane)
        # self.wait(1)
        formula =  MathTex(r'''
                      f(j)= max\{f(j), f(j-w_i)+v_i\} \; j \geqslant w_i
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
                box = SurroundingRectangle(formula[0][31:45],color=b)
            return [ formula[0][22:30].animate.set_color(a),formula[0][31:45].animate.set_color(b)
            ,Create(box)]
        
        def de_light_formula_animate(choose_left=True):
            global box
            return [FadeOut(box),formula[0][22:30].animate.set_color(WHITE),formula[0][31:45].animate.set_color(WHITE)]

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
        vg = VGroup( *[ Rectangle(width=rect_width, height=rect_height,color=None ,stroke_color=WHITE,fill_opacity=0.5) for _ in range(m+1) ])
        
        # 将 VGroup 添加到场景中
        vg.arrange(RIGHT, buff=rect_spacing)
        self.play(Create(vg))
        self.wait(0.5)

        # 创建下标
        index_labels = VGroup( *[MathTex(str(i)).next_to(vg[i],DOWN) for i in range(m+1)])
        self.play(Write(index_labels))
        
        # 填充矩阵0
        text_group = VGroup( *[ MathTex(str(f[i])).move_to(vg[i].get_center()) for i in range(m+1) ])
        self.play(Write(text_group))


        # 创建[i][j] [x][y] 两个矩形的之间的连线
        arrow = Arrow(vg[m].get_top()+UP,vg[m].get_top(),  buff=1, color=RED)
        self.play(Create(arrow))

        # 把arrow 移动到位置j
        def move_arrow(j):
            self.play(arrow.animate.move_to(vg[j].get_top()+UP))

        def light_rect(j):
            self.play(vg[j].animate.set_fill(color=BLUE,opacity =0.5))
        def de_light_rect(j):
            self.play(vg[j].animate.set_fill(opacity =0))
        
        # 选择的文字
        te = MathTex(f"")
        def max_choose_formula(j,i,w,v,new_val) :
            global te
            te = MathTex(f"&max\\{{f(j), f(j-w_{i})+v_{i}\\}} \\\\ &= max\\{{ {f[j]}, {f[j-w]}+{v} \\}} \\\\ &= {new_val}")
            te.to_edge(DOWN)
            self.play(Write(te))

        def de_max_choose_formula() :
            global te
            self.play(FadeOut(te))

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
            for j in range(items_weight[i-1], m+1):
                if j < items_weight[i-1]:
                    break

                move_arrow(j)
                ## 绘制从a点到b点的箭头

                # 得到vg[i][j]上边的中间的点的坐标

                v = items_value[i-1]
                w = items_weight[i-1]
                new_val = f[j]
                light_rect(j-w)
                if f[j] < f[j-w]+v:
                    new_val = f[j-w]+v 

                max_choose_formula(j,i,w,v,new_val)

                f[j] = new_val

                new_text = MathTex(str(f[j])).move_to(vg[j].get_center())
                self.play(Transform(text_group[j], new_text))
                de_light_rect(j-w)
                de_max_choose_formula()
                continue
        
                ## 选中的前一个状态是GREEN
                if j >= items_weight[i-1]:
                    if f[i-1][j] > f[i-1][j-w] + v:
                        f[i][j] = f[i-1][j]
                        self.play(*light_rect_animate(i,j,None,BLUE,GREEN,GRAY_BROWN),*light_formula_animate(True))
                    else:
                        f[i][j] = f[i-1][j-w] + v
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
