---
layout: post
title:  "How well do you know Calvin and Hobbes? An R Game"
date:   2017-03-21 21:27:02 -0700
categories: Post
tags: R
---

One of my most prized possessions is *The Complete Calvin and Hobbes,* the undisputed greatest comic of all time. I defy anyone to name a strip more hilarious, more 
cohesive, more emblematic of the vicissitudes of life. I've read and reread those volumes countless times, and
I rank both Calvin and Hobbes as two of the most influential fictional characters in my life. In fact, I once boasted that I knew
the strip so well, I could predict the content of each strip's final panel while only being shown the first two. Incredulous friends would
test my ability, and it became a fun game that I've since dominated.

But what if I want to play and no one is around? Thankfully, my friend R is always there for me.

<!--more-->

Thus, I set out to create a "game" whereby I would be shown a portion of a Calvin and Hobbes comic, and I would have
to guess the ending before time expired. In the end, it was a relatively simple thing to create, thanks to the
`magick` package. First, I needed to get the comics from somwhere, and I arrived at a [Calvin and Hobbes Daily tumblr](http://calvinhobbesdaily.tumblr.com/) after
some googling. [Tumblr has terrific API docs,](https://www.tumblr.com/docs/en/api/v2) so hacking together a function that grabbed and read 10 random comics was a piece of cake:

{% highlight r %}

library(tidyverse)
library(httr)
library(magick)
library(jsonlite)

get_ten_ch_comics <- function() {
  BASE_URL <- "https://api.tumblr.com"
  url <- modify_url(BASE_URL, 
                    path = c("v2", "blog", "calvinhobbesdaily.tumblr.com", "posts", "photo"),
                    query = list(api_key = Sys.getenv("TUMBLR_KEY"),
                                 limit = 10,
                                 offset = abs(sample(1:2318, 1) - 10))) 
  resp <- GET(url)
  stop_for_status(resp)
  dat <- resp %>% 
    content("text") %>% 
    fromJSON()
  
  map(dat$response$posts$photos, function(x) flatten(x)$url) %>% 
    map(image_read)
}

comics <- get_ten_ch_comics()

{% endhighlight %}

There are 2318 posts on the tumblr account, and I want 10 random comics each time I "play".

I then needed to: (1) display the cropped strips, accounting for whether or not it was a Sunday strip; (2) wait for me to guess the final panels; (3) display the full strip to either
agony or triumph; and (4) repeat. 

{% highlight r %}

for (comic in comics) {
  comic_height <- image_info(comic)$height
  if (comic_height > 275) {
    geometry_crop <- "800 x 500"
  } else {
    geometry_crop <- "400 x 260"
  }
  print(image_crop(comic, geometry = geometry_crop))
  Sys.sleep(15)
  print(comic)
  cat("Press [enter] to continue")
  line <- readline()
}

{% endhighlight %}

There you have it. A *bona fide* Guess-The-Final-Panel-in-a-Calvin-and-Hobbes-Strip game. Just make sure your RStudio viewer is expanded. And if you're curious, I just went 4/10. Time for a reread.


