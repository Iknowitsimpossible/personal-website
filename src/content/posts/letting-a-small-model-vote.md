---
title: "Letting a Small Model Vote"
summary: "A 1.5B model got 68% of 200 math problems right with one answer and 80.5% with a vote over ten. The more interesting number is what the vote still missed."
date: 2026-11-09
category: project-log
draft: false
---

Ask a language model the same math problem ten times and you can get several different answers. Self-consistency, an idea from [Wang et al. (2022)](https://arxiv.org/abs/2203.11171), turns that randomness into a tool: sample many solutions, then keep the answer that shows up most often.

I wanted to test it on a small model, and to find out where it stops helping. The code and saved results are in [this repository](https://github.com/Iknowitsimpossible/gsm8k-self-consistency).

## The experiment

I ran [Qwen2.5-1.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct) on a free Google Colab GPU, using the first 200 problems from the test split of [GSM8K](https://huggingface.co/datasets/openai/gsm8k), a set of grade-school math word problems that take several steps to solve. Every prompt asked the model to solve the problem step by step and finish with `Answer: <number>`.

I compared two ways of generating a solution:

- **Greedy:** the model always takes its most likely next token, so each problem gets one fixed answer.
- **Sampling:** the model picks tokens with some randomness (temperature 0.7, top-p 0.95). I drew 10 solutions per problem and took the most common final number.

Because I saved all 10 answers for every problem, I could compute the result for any smaller vote without running the model again.

## The result

Voting worked:

- **One greedy answer:** 68.0% (136 of 200)
- **One sampled answer:** 70.0% (140 of 200)
- **Majority vote over 10 samples:** 80.5% (161 of 200)
- **Right answer anywhere in the 10 samples:** 93.5% (187 of 200)

Against the greedy answer, the vote fixed 30 problems and broke 5. That lopsided split makes the gain hard to write off as luck, even with only 200 problems. It isn't free, though: 10 samples means 10 times the generation.

<img src="/images/gsm8k-accuracy-vs-samples.png" width="1360" height="800" loading="lazy" alt="Line chart of accuracy against the number of samples in the vote. Accuracy is 70 percent at one and two samples, then 74.5, 75.5, 78, 80.5, 81.5, 81.5, 80 and 80.5 percent at ten samples. A dashed line marks the single greedy answer at 68 percent." />

Most of the gain arrives early. Accuracy climbs to 80.5% by 6 samples and then stays flat at around 80 to 81.5%. I wouldn't read anything into the small dip at 9 samples, since one problem is worth only half a point here. Two samples always match one sample, because a 1–1 tie goes to whichever answer came first.

## Does voting help more on hard problems?

I used the number of steps in GSM8K's reference solution as a rough measure of difficulty.

<img src="/images/gsm8k-accuracy-by-difficulty.png" width="1360" height="800" loading="lazy" alt="Bar chart comparing one sampled answer with a vote of ten samples. Easy problems: 77.6 and 87.9 percent. Medium problems: 55 and 65 percent. Hard problems: 63.6 and 75 percent." />

Not in this data. The gain was about 10 points at every level: +10.3 on easy, +10.0 on medium, and +11.4 on hard. Medium problems scoring below hard ones is probably noise, or a sign that solution length is an imperfect stand-in for difficulty.

## What the vote still misses

Here is where all 200 problems ended up:

<img src="/images/gsm8k-where-problems-ended-up.png" width="1360" height="500" loading="lazy" alt="Stacked bar of 200 problems. In 161 the vote picked the right answer, in 26 the right answer was generated but lost the vote, and in 13 the right answer was never generated." />

Two things stand out in the 39 problems the vote got wrong.

**The model is usually unsure, not confidently wrong.** In only 3 of the 39 did 7 or more samples agree on the same wrong answer. Most of the time the samples scattered.

**The right answer is often there, but it loses.** It appeared in the samples for 26 of the 39. A perfect selector would take accuracy from 80.5% to 93.5% without generating anything new.

That 93.5% is a ceiling, and a hard one to reach. In 18 of those 26 problems, the right answer appeared only once or twice out of 10. Counting votes can't find an answer like that. Something would have to judge the reasoning itself. A match on the final number also doesn't prove the reasoning behind it was sound.

Scattered samples can still produce the right result. On a problem about flipping a house, the greedy answer was $80,000 and the correct answer was $70,000. The 10 samples gave 7 different answers, but $70,000 came up 3 times, and no other answer came up more than twice. So it won with only 3 votes.

## What the mistakes looked like

Before scaling up, I read every wrong greedy answer on the first 10 problems. Five were wrong, and all five were misreadings of the problem, not arithmetic slips:

- Treating a 150% increase in a house's value as its final price
- Treating "3 times a week" as 3 times every day
- Reading "every second glass is discounted" as every glass after the first
- Restarting a download at 50% instead of 40%
- Treating 2 hours stuck in traffic as driving at 30 mph

Voting fixed the first two. The other three stayed wrong.

## What this doesn't show

This is one model, one temperature, and one prompt on 200 problems, so differences of a point or two mean nothing. The difficulty comparison also starts from one sampled answer, not the greedy one, so its gains are smaller than the 12.5-point jump over greedy.

## What's next

The gap between 80.5% and 93.5% is the next thing to go after. I want to try a **verifier**, a model that scores candidate solutions, following [Cobbe et al. (2021)](https://arxiv.org/abs/2110.14168), and compare it with majority voting at the same compute. Voting only asks which answer is most popular. A verifier can ask which answer looks right.
