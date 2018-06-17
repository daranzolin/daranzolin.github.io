---
layout: post
title:  "Introducing ViewPipeSteps: Towards Observable Programming in R"
date:   2018-02-25 13:15:02 -0700
categories: Post
tags: R addin
---

[Sophie Alpert makes several good points in a recent post on 'Observable programming':](https://sophiebits.com/2018/02/22/observable-programming.html)

> Excel is unusually good at allowing you to build complex programs while allowing you to see the values of every intermediate computation
...In contrast, traditional programming environments make the code you write much clearer...But they’re usually terrible at allowing you 
to observe the behavior of your program when subjected to concrete values.

All true. She continues:

<!--more-->

> Our best tools are usually manual log statements and debuggers where you can step through code in one direction but which don’t facilitate the same type of observability that Excel produces without trying.

Hold this thought.

Have you ever been on a programming 'roll'? Like you have a flash of insight and a sequence of functions springs into mind. 
You start coding: *pipe-function-pipe-function-pipe-function...* You write a dozen or so lines before ever checking the validity 
and output of each operation. Then you rub your hands together in excitement, highlight the chain, hit `command-enter`, and...Error.
*Ugh, what happened?* you mutter.

As an unabashed print debugger, I would check the error message and then insert a series of `View` statements wherever I think the
error occurred. *What exactly did gather do? What does my new variable from mutate look like?* In other words, 
I would need *to see* what was changing in my data frame along the way.

This is a tedious and unenjoyable process. It makes me feel like a hack and reinforces 
Sophie's argument about Excel's relative advantage. In Excel, we observe; while programming, we abstract. 
She then issues a challenge:

> How can we build tools that give us the best of both worlds? 

This was the genesis of [my new package, `ViewPipeSteps`.](https://github.com/daranzolin/ViewPipeSteps) The RStudio addin attempts to enhance the *observability* of the programming
experience, particularly within the context of the tidyverse. By highlighting any pipe sequence, the addin will generate numbered `View`
tabs, allowing you to observe all the output of your code, step-by-step:

![Alt Text](https://media.giphy.com/media/dZykYT3Z8kvlNnxaSK/giphy.gif)

My hope is that it saves users a little time debugging. I suspect it could also be a useful teaching tool. An instructor, for example, could highlight a sequence and both explain *and show* what happens after each step. 
