---
layout: post
title:  "'Looping' and 'Branching' with Pipes"
date:   2020-09-03 13:15:02 -0700
categories: Post
tags: R
---

Whilst programming, I am a Don't Repeat Yourself (DRY) devotee. I am also frequently side-tracked by ancillary exploration: "Hmmm, what about this instead?" "What if I tried this really quick?" "Ohhhh should I check this variable too?" My point is this: exploratory data analysis is seldom linear; I often want to *loop back* or *branch off* from my pipes, preferably with minimal syntactical friction, and definitely without repeating myself. In this blog I'll show two ways to 'loop' and 'branch' with pipes. 

<img src="/img/loopandbranch.png" alt="pipeflow" align="center"/> 

## 'Looping' with hacksaw

For example: I neither enjoy writing nor seeing code like this:

{% highlight r %}
library(palmerpenguins)
library(tidyverse)

penguins %>% 
  count(species)

penguins %>% 
  count(island)

penguins %>% 
  count(year, sex)
{% endhighlight %}

This irksome repetition was the primary motivation for [my hacksaw package.](https://github.com/daranzolin/hacksaw) Rather than re-type `penguins %>% count(...)` N amount of times, I can write this instead:

{% highlight r %}
library(hacksaw)

penguins %>%
    count_split(
        species,
        island,
        across(c(year, sex))
    )

# Or
# penguins %>%
#    eval_split(
#        count(species),
#        count(island),
#        count(year, sex)
#    )
{% endhighlight %}

```
[[1]]
# A tibble: 3 x 2
  species       n
  <fct>     <int>
1 Adelie      152
2 Gentoo      124
3 Chinstrap    68

[[2]]
# A tibble: 3 x 2
  island        n
  <fct>     <int>
1 Biscoe      168
2 Dream       124
3 Torgersen    52

[[3]]
# A tibble: 9 x 3
   year sex        n
  <int> <fct>  <int>
1  2009 male      59
2  2009 female    58
3  2008 male      57
4  2008 female    56
5  2007 male      52
6  2007 female    51
7  2007 NA         7
8  2009 NA         3
9  2008 NA         1
```

Not *that's* DRY! Note how `count_split` and `eval_split` recycle the original data frame. hacksaw provides this 'looping' `*_split` construct with most dplyr verbs, and for me, this saves some time, keystrokes, and mild annoyance.

## 'Branching' with nakedpipe

Again, I sometimes wish to 'branch' off from my main pipeline rather than assign an intermediate object. The reason is threefold: (1), because naming things is hard; (2) I prefer fewer objects in my environment; and (3) I want to be DRY.

Consider the following example from [the excellent infer package:](https://github.com/tidymodels/infer)

{% highlight r %}
library(infer)

# Calculate observed statistic
d_hat <- offshore %>%
  specify(response ~ college_grad, success = "no opinion") %>%
  calculate(stat = "diff in props", order = c("yes", "no"))

# Simulated null distribution
null_distn_two_props <- offshore %>%
  specify(response ~ college_grad, success = "no opinion") %>%
  hypothesize(null = "independence") %>%
  generate(reps = 10000) %>%
  calculate(stat = "diff in props", order = c("yes", "no"))

# Bootstrap distribution
boot_distn_two_props <- offshore %>%
  specify(response ~ college_grad, success = "no opinion") %>%
  generate(reps = 10000) %>%
  calculate(stat = "diff in props", order = c("yes", "no"))

{% endhighlight %}

Note how `offshore %>% specify(response ~ college_grad, success = "no opinion")` is called *three* times. Not a bad thing, but wouldn't it be nice to do it only once and then branch off mid-piping? This is possible with [the nakedpipe package:](https://github.com/moodymudskipper/nakedpipe)

{% highlight r %}
library(nakedpipe)

offshore %.% {
  specify(response ~ college_grad, success = "no opinion")
  
  # BRANCH OFF
  ~~calculate(., stat = "diff in props", order = c("yes", "no")) -> d_hat
  
  # BRANCH OFF
  ~~. %.% {
    generate(reps = 1000, type = "bootstrap")
    calculate(., stat = "diff in props", order = c("yes", "no"))

  # BRANCH OFF
    ~~get_ci(.) -> ci

  } -> boot_dist
  
  # CONTINUE ON
  hypothesize(null = "independence")
  generate(reps = 1000, type = "permute")
  calculate(., stat = "diff in props", order = c("yes", "no"))
} -> null_dist

{% endhighlight %}

The syntax is odd to see but easy to type--I actually very much enjoy the nakedpipe experience, as it facilitates this kind of 'branched' thinking.[^1]

[^1]: And I never accidentally hit Ctrl+N instead of Ctrl+M...

In sum, I am not sure either of these features, 'looping' with hacksaw and 'branching' with nakedpipe, rises to the level of 'best practices', but I appreciate how they are better syntactical reflections of both my own thought process and coding preferences. Worth trying IMHO!









