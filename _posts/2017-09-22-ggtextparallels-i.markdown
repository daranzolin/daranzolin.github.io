---
layout: post
title:  "Introducing ggtextparallels"
date:   2017-09-23 20:15:02 -0700
categories: Post
tags: R 
---

The purpose of this post is to [introduce ggtextparallels,](https://github.com/daranzolin/ggtextparallels) a tool for ~~cheap~~ frugal biblical scholars who don't want to pay for books
and other proprietary software. Somewhere on the internet Hadley Wickham advises new R developers to find problems and then try and solve them. 
Within that framework, the problem is [about](https://www.amazon.com/Gospel-Parallels-Comparison-Synoptic-Standard/dp/0840774842) [$70](https://www.amazon.com/Synopsis-Quattuor-Evangeliorum-Bible-Students/dp/3438051303) 
(plus shipping and handling) and the solution is `devtools::install_github("daranzolin/ggtextparllels")`. 

<!--more-->

`ggtextparallels` sports two functions: `ggtextparllel` and `gglangparellel`. The former plots passages across *gospels* and 
the latter plots passages across *versions.* A brief demonstration is below.

The gospels are fascinating for a million reasons, but their intertextuality has captivated readers for almost 2000 years. 
Did Matthew and Luke use Mark? Why does Matthew and Luke have stories that Mark doesn't? Why is John so different? These are questions without firm answers. But we can better understand the differences and similarities by viewing the texts alongside each other. With a few APIs and the brilliance of `ggplot2`, creating such a tool is a snap.

Note the differences in John the Baptist's Messianic preaching:

```
ggtextparallel(16, version = "eng-ESV")

```

![useful image]({{ site.url }}/assets/Jb.png)

If you want to dip into the original greek, you can flip the version argument:

```
ggtextparallel(16, version = "grc")

```

![useful image]({{ site.url }}/assets/Jog.png)

Or you want to see it in Spanish?


```
ggtextparallel(16, version = "spa-RVR1960")

```

![useful image]({{ site.url }}/assets/Jus.png)

Over 275 languages across 300 versions are available. Consult the lazily loaded `biblesearch_versions` object for available versions.

The package has a second function, `gglangparallels` for the bilingual and trilingual. Here you can view one passage across multiple versions:

```
gglangparallel(c("eng-ESV", "spa-RVR1960", "por-NTLH"), book = "john", verses = "1:1-5")

```

![useful image]({{ site.url }}/assets/Versions.png)

I have tentative plans to create a `bookdown` function that would create an entire book in parallel of any input versions/languages. Or perhaps
a shiny web app. Regardless, I hope it saves some poor student $80 down the road.


