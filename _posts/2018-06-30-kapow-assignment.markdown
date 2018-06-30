---
layout: post
title:  "Introducing kapow: an explosive but maybe irresponsible way to assign variables from objects"
date:   2018-06-30 11:15:02 -0700
categories: Post
tags: R
---

Assignment in R is a somewhat controversial thing, and there is only a loose consensus around best practices. The crux of the issue, I think, is readability vs. writability. Reading code can be a struggle; programmers want to reduce the amount of mental hurdles and friction on the way to understanding. Towards that end, we want clear and predictable syntax with strong visual cues. Consider these four examples:

1. Is it appropriate to use `=` for assignment instead of `<-`?
2. Is it appropriate to use `->` for assignment, e.g. `iris %>% filter(Species == "setosa") -> setosa_iris`?
3. Is it appropriate to use the `%<>%` operator from `magrittr`?
4. Is it *ever* appropriate to use the `<<-` operator? 
5. Is it ever appropriate to use the `assign()` function?

<!--more-->

The first lacks a strong visual cue, the second is somewhat unpredictable, the third is unfamiliar, no one knows when the fourth is appropriate, and the fifth lacks writabililty. In my opinion, an innovative new operator that passes every test is the `zeallot` package's `%<-%` operator. R programmers can quickly infer the result by virtue of its familiarity and great documentation.

Which brings us to [`kapow`, my new R package.](https://github.com/daranzolin/kapow) The goal was to make variable assignment as seamless as possible, and while I think it is ultimately successful, I readily admit that it fails all of the above considerations. But what it lacks in readability, however, it almost makes up for in writability. When you know you want to pull out and assign a column or two from a data frame, the `kapow()` function does it automatically. AND, `kapow()` features a new sensory cue: SOUND! Calling the function triggers an auditory explosion, courtsey of the `beepr` package, intended to alert you that something happened. A brief example is below:

{% highlight r %}
library(kapow)

crimeEnv <- new.env()
USArrests %>% 
  filter(Murder > 10) %>% 
  mutate(Large_Urban_Pop = if_else(UrbanPop > 75, TRUE, FALSE)) %>% 
  kapow(Murder, Assault, Large_Urban_Pop, envir = crimeEnv)

ls(crimeEnv)

{% endhighlight %}

```
#> [1] "Assault"         "Large_Urban_Pop" "Murder"
```

Note that if you're being cautious about polluting the `.GlobalEnv`, you can also specify the environment in which the variables will be assigned. You can also toggle the `stop_on_overwrite` boolean parameter if you don't want to overwrite existing values.

This package admittedly tows the line between productivity and absurdity, but it might save some typing during your exploratory data analysis.

