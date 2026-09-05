from  manim import *

class full_permutation(Scene):
    def construct(self):
        data = [1,2,3]
        # 创建 盒子
        buff = 0.5
        boxes = [ Square(side_length=1,color=BLUE).set_fill(BLUE,opacity=0.5).move_to([(i-1)*(buff+1) - len(data)/2,-1.5,0]) for i in data]
        # self.add(*boxes)

        # 创建 下标
        indices = [ Text(str(i)).next_to(boxes[i-1],DOWN,buff=0.6) for i in data]
        # self.add(*indices)

        # 
        ball_buff = buff+0.5

        ellipse = Ellipse(width= len(data)*ball_buff,height=1.2)
        balls = [] 
        balls_pos = [
            [ (i-1)*ball_buff - len(data)//2 * ball_buff ,2,0 ] for i in data
        ]
        for i in data :
            gr = VGroup()
            gr.add(Circle(radius=0.3).set_fill(GREEN,opacity=0.5))
            gr.add(Text(str(i)))
            gr.move_to(balls_pos[i-1])
            balls.append(gr)

        # self.add(*balls)

        ellipse.move_to( balls[1].get_center())

        # self.add(ellipse)

        arrow = Arrow(start=UP*0.5,end=DOWN,color=GOLD).next_to(boxes[0],UP)

        self.play( *[Create(indices[i]) for i in range(3)],
            *[Create(boxes[i]) for i in range(3)],
            Create(ellipse),
            Create(arrow),
        *[Create(balls[i]) for i in range(3)],
                  )
        self.wait(1.5)

        used = [0,0,0,0]
        choose = [0,0,0]
        _cnt = 0

        # 递归求
        def full_permutation_dfs(dep):
            nonlocal _cnt
            if dep > 2:
                _cnt+=1
                self.play(Create( Text( ','.join(map(str,choose))).move_to([5,4-_cnt,0]) ))
                self.wait(1)
                return
            for i in range(3):
                if used[i] == 0:
                    used[i] = 1
                    self.play(balls[i].animate.move_to( boxes[dep].get_center() ))
                    choose[dep] = data[i]
                    if dep+1 <=2:
                        self.play(arrow.animate.next_to(boxes[dep+1],UP));
                    full_permutation_dfs(dep+1)
                    if dep+1 <=2:
                        self.play(arrow.animate.next_to(boxes[dep],UP));
                    used[i] = 0
                    self.play(balls[i].animate.move_to( balls_pos[i] ))
        full_permutation_dfs(0)
            
        
        