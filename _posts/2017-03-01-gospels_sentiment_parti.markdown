---
layout: post
title:  "Sentiment Analysis of the Four Gospels, Part I"
date:   2017-03-01 21:27:02 -0700
categories: Post
tags: R rperseus textmining
---

The purpose of this post is twofold: (1) to introduce [rperseus, my latest R package;](https://github.com/daranzolin/rperseus) and (2) to venture a sentiment analysis of the 
four gospels. 

Rivers of ink have been spilled over the unity and disunity of the four gospels. Their intertextualities have inspired almost two millenia of 
speculation both scholarly and pious. We may never know if Q existed, or discern John's stages of composition, or figure 
out what the devil *bdelugma tes eremoseos* (NRSV: "desolating sacriliege") means. But now, almost 2000 years removed from their 
original composition, we can do a sentiment analysis! And we owe it all to `tidytext` and the 
good people over at [the Perseus Digital Library.](http://www.perseus.tufts.edu/hopper/)

<!--more-->

### Getting the Text

First, we need the gospel texts. For mortals this is impossible, but with R all things are possible[^1]. Towards that end, `rperseus` combines seamlessly with
the tidyverse to bring the english text into R.[^2] Here's what's happening. First, I obtain the perseus digital library catalog with `get_perseus_catalog`.
You need to know each text's Uniform Reference Number (URN) before getting the text. Second, I filter the catalog for New Testament works and grep
for "Gospel". Third, I iterate through the vector of urns, requesting the English text of each gospel. Fourth, I create the chapter column and return
a data frame. And fifth, I join the perseus catalog back onto our `gospels` data frame with cleaner labels.

{% highlight r %}

library(rperseus)
library(tidyverse)
library(tidytext)

perseus_catalog <- get_perseus_catalog()
gospels <- perseus_catalog %>% 
  filter(groupname == "New Testament",
         grepl("Gospel", label)) %>%
  .$urn %>%
  map(get_perseus_text, "eng") %>% 
  map_df(mutate, chapter = row_number())
  
gospels <- left_join(gospels, perseus_catalog %>% 
                       mutate(book = stringr::str_replace(label, "Gospel according to ", "")) %>% 
                       select(urn, book), by = "urn")

{% endhighlight %}

Let's glance at `gospels`:

```

glimpse(gospels)
Observations: 89
Variables: 4
$ urn     <chr> "urn:cts:greekLit:tlg0031.tlg003", "urn:cts:greekLit:tlg0031.tlg003", "urn:cts:greek...
$ text    <chr> "Since many have undertaken to set in order a narrative concerning those matters whi...
$ chapter <int> 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 2...
$ book    <chr> "Luke", "Luke", "Luke", "Luke", "Luke", "Luke", "Luke", "Luke", "Luke", "Luke", "Luk...

```

Those 89 observations correspond to the 89 chapters combined in Matthew, Mark, Luke, and John.

### Tidying the Text

With the text in hand, we can unleash `tidytext`. Much of what follows is adapted from the [tidytext vignette,](https://cran.r-project.org/web/packages/tidytext/vignettes/tidytext.html) which is brilliant. I added
a few tweaks of my own, though. 

The first step is to unnest the word tokens and remove the stop words:

{% highlight r %}

gospel_words <- gospels %>% 
  unnest_tokens(word, text)

data("stop_words")
gospel_words <- gospel_words %>%
  anti_join(stop_words)

{% endhighlight %}

### Sentiment Analysis 

Now the fun begins. What are the most frequently appearing *joyous* words in each gospel? I filtered out "god" so we could see some
of the more distinctive words.

{% highlight r %}

gospel_words %>%
  filter(word != "god") %>% 
  semi_join(nrc %>% 
              filter(sentiment == "joy")) %>%
  count(book, word, sort = TRUE) %>% 
  group_by(book) %>% 
  slice(1:3)
  
{% endhighlight %}

```
  
Source: local data frame [12 x 3]
Groups: book [4]

      book    word     n
     <chr>   <chr> <int>
1     John    love    20
2     John   glory    17
3     John    true    16
4     Luke   found    30
5     Luke blessed    27
6     Luke  mother    21
7     Mark  mother    19
8     Mark   child    11
9     Mark   found    10
10 Matthew  mother    28
11 Matthew blessed    17
12 Matthew    tree    15

```

Gotta admit, I did not see "tree" coming. Odd. Given the nativity accounts in Matthew and Luke, seeing "mother" is unsurprising, but I didn't
expect to see it in Mark too. "Love", "glory", and "true" from John is also unsurprising.

What are the most *disgust-inducing* words?

```
Source: local data frame [12 x 3]
Groups: book [4]

      book    word     n
     <chr>   <chr> <int>
1     John     sin    16
2     John   flesh    13
3     John   death    12
4     Luke     woe    15
5     Luke    evil    14
6     Luke    tree    11
7     Mark unclean    11
8     Mark   death     9
9     Mark    sick     9
10 Matthew    evil    26
11 Matthew    tree    15
12 Matthew     woe    14

```
Tree again?! I don't have an explanation.

Finally, let's locate the most negative chapter in each gospel:

{% highlight r %}

bingnegative <- get_sentiments("bing") %>%
  filter(sentiment == "negative")

wordcounts <- gospel_words %>%
  group_by(book, chapter) %>%
  summarize(words = n())

gospel_words %>%
  semi_join(bingnegative) %>%
  group_by(book, chapter) %>%
  summarize(negativewords = n()) %>%
  left_join(wordcounts, by = c("book", "chapter")) %>%
  mutate(ratio = negativewords/words) %>%
  filter(chapter != 0) %>%
  top_n(1)
  
{% endhighlight %} 

```
Source: local data frame [4 x 5]
Groups: book [4]

     book chapter negativewords words     ratio
    <chr>   <int>         <int> <int>     <dbl>
1    John       9            20   170 0.1176471
2    Luke       6            45   330 0.1363636
3    Mark       5            30   236 0.1271186
4 Matthew      23            37   257 0.1439689

```

What's happening in each chapter? 

**John 9:** Jesus heals a man born blind who is then questioned by the Pharisees. The words "sin" and "blind" appear almost every other sentence.

**Luke 6:** Jesus preaches the devastating Sermon on the Plains, a rebuke to those who are rich, laughing, and full. "Woe" and "judge" appear often.

**Mark 5:** Three longish stories (for Mark) appear here. First, Jesus confronts the Geresene demonianc and drives out the unclean spirits. Second, Jesus heals the woman with hemorrages. Third, Jesus raises Jairus' daughter. "Death", "howling", and "wailing" define this pericope.

**Matthew 23:** This was the least surprising. Here Jesus excoriates the Pharisees. I mean, it is brutal. Lots of "woes" and "hypocrites".

I'd say it checks out! In part II we'll trot out some visualizations. Stay tuned.



[^1]: Pardon this casually idolatrous paraphrase.
[^2]: At least, the translation by Rainbow Missions, Inc., a revision of the American Standard Version of 1901.
