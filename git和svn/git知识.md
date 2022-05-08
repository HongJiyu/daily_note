# 基本api

工作区=》暂存区=》本地仓库 =》远程仓库

```shell
git clone <url>   #克隆一份远程仓库文件
git checkout -b <newbranch>  #在本地仓库创建分支
git branch   # 查看分支
git add .  # 修改代码后add到暂存区
git commit -m "new content"  # 将代码放到本地仓库
git remote add <project> <url> # 配置远程仓库
git pull <porject> <branch>   # 从远程仓库获取最新代码
git push <project> <newbranch> # 将本地仓库代码更新到远程仓库

git merge <branch>  #合并本地<branch>分支到当前分支
git merge <project>/<branch> # 合并远程分支到当前分支

#通过git status查看信息
git status

#回滚
#1.只是在工作区修改，撤销修改
git restore <file>...
#2.只是提交到暂存区（执行了add），退回到工作区
git restore --staged <file>...
#commit后，想要回滚
git reset --soft HEAD^  # 回退到add状态  HEAD^ 表示上一个版本，即上一次的commit，也可以写成HEAD~1
git reset --hard HEAD^ # 回退到工作区，且修改全部撤销。HEAD^ 表示上一个版本，即上一次的commit，也可以写成HEAD~1
#push后回滚、回退到某个版本，和commit后回滚一样。
https://blog.csdn.net/shujuliu818/article/details/121041565
# git reset 后git push即可
```

# .gitignore 

配置语法：

　　以斜杠“/”开头表示目录； /modules/

　　以星号“*”通配多个字符；/m\*/

　　以问号“?”通配单个字符； /module?/

　　以方括号“[]”包含单个字符的匹配列表；

　　以叹号“!”表示不忽略(跟踪)匹配到的文件或目录；



# 注释

Added ( 新加入的需求 )

Fixed ( 修复 bug )

Changed ( 完成的任务 )

Updated ( 完成的任务，或者由于第三方模块变化而做的变化 )