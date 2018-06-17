---
layout: post
title:  "US Senator Tweets, Part III"
date:   2016-10-15 20:36:02 -0700
categories: Tutorial
tags: R twitter politics textmining
---

At long last we come to the end of this series. I confess that I lost interest when--spoiler alert--there was nothing exciting 
to report here. But for the sake of symmetry, here in Part III we'll delve into the tweets themselves with the awesome `tidytext` package.

Full disclosure: what follows is basically [David Robinson's brilliant analysis of Trump's twitter feed](http://varianceexplained.org/r/trump-tweets/) with a different
twist: instead of examining tweets *by source*, we're examining them *by party*. 

<!--more-->

We have all the tweets stored in our `sen_tweets` object. Using `tidytext` and a dash of regular expressions, we'll unnest each word
within tweets containing "Hillary" or "Clinton". We'll do the same with "Donald" and "Trump" in a separate object:

{% highlight r %}
library(tidytext)

reg <- "([^A-Za-z\\d#@']|'(?![A-Za-z\\d#@]))"
hc_words <- sen_tweets %>%
  filter(!str_detect(text, '^"')) %>%
  filter(grepl("Hillary|Clinton", text)) %>% 
  mutate(text = str_replace_all(text, "https://t.co/[A-Za-z\\d]+|&amp;", "")) %>%
  unnest_tokens(word, text, token = "regex", pattern = reg) %>%
  filter(!word %in% stop_words$word,
         str_detect(word, "[a-z]"))
         
dt_words <- sen_tweets %>%
  filter(!str_detect(text, '^"')) %>%
  filter(grepl("Donald|Trump", text)) %>% 
  mutate(text = str_replace_all(text, "https://t.co/[A-Za-z\\d]+|&amp;", "")) %>%
  unnest_tokens(word, text, token = "regex", pattern = reg) %>%
  filter(!word %in% stop_words$word,
         str_detect(word, "[a-z]"))
{% endhighlight %}

Next we'll grab the [NRC Emotion Lexicon](http://saifmohammad.com/WebPages/NRC-Emotion-Lexicon.htm) that comes with the `tidytext` package:

{% highlight r %}
nrc <- sentiments %>%
  filter(lexicon == "nrc") %>%
  select(word, sentiment)
{% endhighlight %}

**Question: what kinds of sentiments occur when *democratic* senators tweet about Hillary?**

{% highlight r %}
hc_words %>%
  inner_join(nrc, by = "word") %>%
  filter(party == "Democrat") %>% 
  count(sentiment, sort = TRUE)
Source: local data frame [10 x 2]

      sentiment     n
          <chr> <int>
1      positive    27
2         trust    14
3  anticipation    10
4          fear     5
5      negative     5
6       sadness     5
7           joy     4
8      surprise     4
9         anger     3
10      disgust     3
{% endhighlight %}

**Question: what kinds of sentiments occur when *republican* senators tweet about Hillary?**

{% highlight r %}
hc_words %>%
  inner_join(nrc, by = "word") %>%
  filter(party == "Republican") %>% 
  count(sentiment, sort = TRUE)

Source: local data frame [9 x 2]

     sentiment     n
         <chr> <int>
1     negative    29
2        trust    23
3     positive    21
4          joy     8
5        anger     3
6 anticipation     2
7         fear     2
8      sadness     2
9     surprise     2
{% endhighlight %}
Hmmm, yea, not really anything interesting to see here. How about party sentiments towards Trump?

**Democrat:**

{% highlight r %}
Source: local data frame [10 x 2]

      sentiment     n
          <chr> <int>
1      negative    39
2      positive    31
3  anticipation    23
4      surprise    20
5       sadness    19
6         anger    18
7          fear    16
8         trust    16
9           joy    10
10      disgust     9
{% endhighlight %}

**Republican:**

```
Source: local data frame [10 x 2]

      sentiment     n
          <chr> <int>
1      negative    24
2      positive    19
3         trust    15
4         anger    13
5      surprise    13
6       sadness    12
7          fear    10
8       disgust     8
9  anticipation     6
10          joy     4
```
Maybe a little more of a sharper contrast. Let's take a look at the "positive" words that appear in the democrats' Trump tweets:

```
 [1] "tremendously"  "building"      "real"          "build"         "pay"           "fair"          "share"        
 [8] "vote"          "completely"    "public"        "reaffirm"      "extraordinary" "expect"        "deserve"      
[15] "candidate"     "dear"          "proud"         "president"     "powerful"      "proud"         "pay"          
[22] "god"           "tutor"         "real"          "debate"        "supreme"       "independence"  "clean"        
[29] "revolution"    "question"      "agree"  
```

My intuition is that these are preceded or followed by negations, which complicates text analysis. Also, what was that god tweet? Could have
gone a number of ways, but here's the tweet from Senator Chris Murphy:

{% highlight r %}
sen_tweets %>% 
  filter(party == "Democrat",
         grepl("god", text, ignore.case = TRUE)) %>% 
  .$text
"OH MY GOD.  Russia is not killing ISIS, Donald.  They are facilitating the slaughter of civilians.  
This is Putin's talking points on stage."
{% endhighlight %}
Thus ends our series.


