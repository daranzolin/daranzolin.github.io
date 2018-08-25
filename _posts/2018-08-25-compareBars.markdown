---
layout: post
title:  "Introducing compareBars: Simplify comparative bar charts
date:   2018-08-25 11:15:02 -0700
categories: Post
tags: R dataviz
---

In data visualization, less is often more, and the best advice is almost always "simplify simplify". When viewing a chart, the viewer's attention should be immediately drawn to something worth emphasizing: an outlier, a contrast, a pattern, etc. The less elements on the page the better.

<!--more-->

For example, consider the following charts:

{% highlight r %}
library(tidyverse)
library(gapminder)
library(patchwork)

d <- gapminder %>% 
  filter(continent %in% c("Americas", "Europe")) %>% 
  group_by(continent, year) %>% 
  summarize(pop = sum(pop))

p1 <- ggplot(d, aes(year, pop, fill = continent)) + geom_col()
p2 <- ggplot(d, aes(year, pop, fill = continent)) + geom_col(position = "dodge")

p1 + p2 + plot_layout(ncol = 1)

{% endhighlight %}

<img src="/img/blog/gg1.png" alt="gg1" align="center"/> 

I ask you: when did the total population of the Americas exceed the total population of Europe? With the top chart, you’d guess sometime between 1960 and 1980, but it’s hard to tell at a glance. And while it’s easier to tell with the second plot, the clarity comes at the sake of clutter. The surplus of bars is messy and you have to use your imagination to fill in the blank space representing the difference in magnitude. I also find it annoying to squint and focus on individual pairs of bars. Not a great dataviz IMHO.

Mike Bostock recently produced a pleasing alternative that combines the two levels into a single bar and fills in the difference accordingly. [I reproduced his work in R here,](https://rpubs.com/daranzolin/reproduced3js1) although reshaping the data required some tidyverse wizardry, 60+ lines of code, and a couple hours of my life. Wishing to abstract this plot behavior, I then [solicited the RStudio community for the creation of a new ggplot Geom or Stat,](https://community.rstudio.com/t/how-to-abstract-this-fill-behavior-with-ggplot-new-geom-new-stat/12028/2) and although John Lewis came close, neither of us conjured a solution. I still do not understand what `compute_group` really does within the ggplot framework. 

And so, wishing to (1) create something cool; (2) better learn d3.js; and (3) ~~increase my number of github stars~~ share something with the community, I sat down to create a new htmlwidget, `compareBars`.[^1]

[^1]: Shout out to Bob Rudis who made it ok to star your own projects.

`compareBars`, I think, offers a cleaner alternative:

{% highlight r %}
library(compareBars)
d %>% 
  spread(continent, pop) %>% 
  mutate(year = factor(year)) %>% 
  compareBars(year, Americas, Europe)
{% endhighlight %}

<img src="/img/blog/cb1.png" alt="cb1" align="center"/> 

Not only is the moment when the Americas’ population exceeded Europe’s immediately clear, but you also get a much better sense of the difference in magnitude by year. A cleaner and more compelling visualization.

[Check the README for additional customize options.](https://github.com/daranzolin/compareBars)

