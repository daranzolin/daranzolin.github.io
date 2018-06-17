---
layout: post
title:  "US Senator Tweets, Part II"
date:   2016-10-11 20:36:02 -0700
categories: Tutorial
tags: twitter R politics
---

Time to continue where I left off. With each US senator's twitter handle handled, it's time to get their tweets 
following a similar create/use-function-and-iterate pattern.

<!--more-->

### Prep work

Getting started with `rtweet` is relatively simple, and [you can follow the directions on the package's GitHub page.](https://github.com/mkearney/rtweet)
I have an app already in place. In R, this is all we need to do to get started:

{% highlight r %}
library(rtweet)
t_token <- create_token(app = "text_mining_for_r",
                        consumer_key = "Your_Consumer_Key",
                        consumer_secret = "Your_Consumer_Secret")
{% endhighlight %}

### Iterate

Now we'll iterate with `get_timeline()`:

{% highlight r %}
safe_timeline <- possibly(get_timeline, NULL)
tweets <- twitter_accounts$identifier %>% 
  map(safe_timeline, n = 10, token = t_token, lang = "en")
{% endhighlight %}

This was only partially successful, as I ran up against Twitter's API Rate limits. That meant that my `tweets` object had 
about 40 NULL values, and I had to wait an hour before continuing the iteration and binding everything together:

{% highlight r %}
null_handles <- which(unlist(lapply(tweets, is.null)))

tweets2 <- twitter_accounts$identifier[null_handles] %>% 
  map(safe_timeline, n = 10, token = t_token, lang = "en")
  
tweets3 <- Filter(Negate(is.null), c(tweets[-null_handles], tweets2))

tweets4 <- tweets3 %>% 
  map(select, created_at, screen_name, text, is_retweet) %>% 
  bind_rows() %>% 
  left_join(twitter_accounts, by = c("screen_name" = "identifier"))
{% endhighlight %}

### Text Analysis

...Not today. Looks like this just became a three part series.

