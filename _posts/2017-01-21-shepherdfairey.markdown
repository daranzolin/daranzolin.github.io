---
layout: post
title:  "'We the People' + ImageMagick"
date:   2017-01-22 16:27:02 -0700
categories: Post
tags: R
---

Yesterday I dipped my toes in the [now raging currents](https://www.theguardian.com/us-news/2016/dec/25/progressive-donations-us-election-planned-parenthood-aclu) of [American activism.](https://www.nytimes.com/2017/01/20/nyregion/trump-presidency-new-york-city.html) Alongside millions of men, women, and children,
we rallied to the #WomensMarch, a full-throated, univocal rejection of Donald Trump and his ilk. 

While the signage ranged from merrily goofy to violently hostile, three images stood apart. I speak of course of 
Shepherd Fairey's breathtaking "We the People" project: *Defend Dignity*, *Are Greater Than Fear*, and *Protect Each Other.*

![We The People](http://newsinfo.inquirer.net/files/2017/01/We-the-People3-620x274.jpg)

<!--more-->

There's raw power in these images. Each is a portrait of American individuality. Each exudes a quiet serenity and hidden strength. They are somehow
so alike, yet also so remarkably distinct. At a glimpse they appear angelic, but on closer inspection they bear the unmistakeable 
contours of human experience. Impossible to explain, but do I detect at least a modicum of sadness behind each
expression?

A good--but admittedly artificial--way to further examine the portraits' unity and disunity is to watch them fade into and out of each other.
This can be accomplished with the brilliant `magick` package, [courtesy of rOpenSci.](https://ropensci.org/) I'm sure there are websites
that could do the same, but creating a gif that morphs each portrait into a cycle was just a few lines of code. See below:

{% highlight r %}

library(magick)

pic_urls <- c("http://1p81x43bivr31yh7xabejfz1.wpengine.netdna-cdn.com/site/wp-content/uploads/2017/01/Shepard-GreaterThanFear_thumb.jpg",
          "http://1p81x43bivr31yh7xabejfz1.wpengine.netdna-cdn.com/site/wp-content/uploads/2017/01/Shepard-DefendDignity_thumb.jpg",
          "http://1p81x43bivr31yh7xabejfz1.wpengine.netdna-cdn.com/site/wp-content/uploads/2017/01/Shepard-ProtectEachOther_thumb.jpg",
          "http://1p81x43bivr31yh7xabejfz1.wpengine.netdna-cdn.com/site/wp-content/uploads/2017/01/Shepard-GreaterThanFear_thumb.jpg")

pics <- c(image_scale(image_read(pic_urls, "300x400")))
face_morphs <- image_animate(image_morph(pics, frames = 45), fps = 10)
image_write(face_morphs, "faces.gif")

{% endhighlight %}

I could stare at the result for hours, which I eventually tweeted out yesterday:

<blockquote class="twitter-tweet" data-lang="en"><p lang="und" dir="ltr"><a href="https://twitter.com/hashtag/WomensMarch?src=hash">#WomensMarch</a> <a href="https://twitter.com/hashtag/WeThePeople?src=hash">#WeThePeople</a> <a href="https://twitter.com/hashtag/rstats?src=hash">#rstats</a> <a href="https://t.co/iKadmAhHz6">pic.twitter.com/iKadmAhHz6</a></p>&mdash; Dave (@daranzolin) <a href="https://twitter.com/daranzolin/status/823058788001333249">January 22, 2017</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

Sidebar: I actually couldn't rely on the tidyverse here. `purrr::map` coerced the pics into a list that couldn't be recognized by `image_morph`,
or `image_animate`. 
