# Научная ревизия двух проектов IQA R&D школы

Дата ревизии: 3 августа 2026 года.

## Короткий вердикт

Обе темы можно давать студентам, но обе требуют редактуры.

| Тема | Вердикт | Что оставить | Что изменить |
|---|---|---|---|
| 1. Query conditioning | Сильная тема после уточнения | Контролируемое сравнение механизмов conditioning | Явно определить per-image `d(x)`; убрать label leakage; сократить V0–V6 до V0–V3; разделить Head-LODO и strict system-LODO |
| 2. Pareto-optimal head | Исходная формулировка частично устарела | Accuracy/efficiency/OOD Pareto и перенос между двумя VLM | После WACV 2026 сузить вопрос до patch/intermediate-token aggregation; убрать ложное «напрямую как Q-Align»; вынести PIPAL/PieAPP из core |

## Тема 1: что не так с исходным якорем

Исходный текст говорит, что MP-IQE уже использует embedding искажения `d` как query. Это неточная интерпретация. В MP-IQE обучаемые scene-prompt и distortion-prompt banks кодируются текстовой веткой, конкатенируются и становятся queries cross-attention над image features. Модель также оптимизирует scene- и distortion-classification losses. Это не внешний per-image distortion encoder.

Следовательно, новая тема должна формулироваться так:

> Если для каждого изображения доступен **предсказанный** frozen distortion prior `d(x)`, какой способ его инъекции в одинаковую query-aggregation голову лучше по OOD-SRCC, стоимости и причинной чувствительности к prior?

Такая постановка остаётся осмысленной даже после близких работ:

- [MP-IQE](https://arxiv.org/html/2404.14949v2) — prompt banks и cross-attention, но не контролируемое сравнение per-image additive / FiLM / prefix;
- [LIQE](https://openaccess.thecvf.com/content/CVPR2023/papers/Zhang_Blind_Image_Quality_Assessment_via_Vision-Language_Correspondence_A_Multitask_Learning_CVPR_2023_paper.pdf) — joint quality/scene/distortion prediction;
- [MMP-IQA / Adaptive Prompt Learning](https://scholar.pku.edu.cn/ttjiang/publications/adaptive-prompt-learning-blind-image-quality-assessment-multi-modal-mixed) — instance-conditioned quality prompt context;
- [DR.Experts](https://ojs.aaai.org/index.php/AAAI/article/view/37401/41363) — distortion-specific VLM priors и dynamic mixture of experts;
- [Distortion-Aware Fusion of Statistical and VLM Features](https://arxiv.org/abs/2606.02002) — multiplicative stream gating.

Новизну нельзя описывать как «до нас никто не использовал distortion priors». Защищаемый claim уже: **равнобюджетное controlled comparison точек инъекции одного и того же predicted prior с intervention tests**.

### Главные методологические риски темы 1

1. **Истинный distortion label на inference нарушает blind setting.** Он допустим только как oracle upper bound.
2. **DIY-классификатор на всех 25 KADID distortions ломает строгий LODO.** Он уже видел held-out class. Frozen ARNIQA тоже видел синтетические искажения в pretraining, поэтому основной тест надо называть Head-LODO.
3. **Случайный image split даёт content leakage.** Все производные одного pristine/reference image должны оставаться в одном split.
4. **Объединение LIVE + CSIQ + TID + KADID не создаёт единой таксономии.** Core лучше делать внутри KADID, а другие базы использовать zero-shot.
5. **Attention-weight — не причинное объяснение.** Нужны matched/shuffled/zeroed prior interventions.
6. **V4–V6 размывают вопрос.** MoE, hypernetwork и latent dictionary меняют уже не только механизм инъекции. Они годятся как stretch или отдельная школа.

### Рекомендованный минимальный эксперимент

- Frozen visual backbone: CLIP ViT-B/16.
- Frozen prior: глобальный feature ARNIQA, нормализованный и линейно спроецированный.
- Head: один query cross-attention layer, 8 queries.
- Variants: no-prior, additive, FiLM zero-init, prefix/KV.
- Train: KADID-10k, split 70/10/20 по reference ID.
- Generalization: семь официальных KADID-групп (blur, color, compression, noise, brightness, spatial, sharpness/contrast) как LODO-folds; zero-shot CSIQ и TID2013.
- Seeds: 8, 19, 25.
- Metrics: SRCC primary; PLCC; worst-family SRCC; trainable params; end-to-end batch-1 latency; peak VRAM.
- Intervention: matched, shuffled и zeroed `d`.

## Тема 2: почему исходную формулировку нужно сузить

[Revisiting Vision–Language Foundations for No-Reference Image Quality Assessment (WACV 2026)](https://openaccess.thecvf.com/content/WACV2026/papers/Yadav_Revisiting_Vision-Language_Foundations_for_No-Reference_Image_Quality_Assessment_WACV_2026_paper.pdf) уже сравнила шесть pretrained backbones — CLIP, SigLIP 2, DINOv2, DINOv3, Perception и ResNet — в едином NR-IQA pipeline. Авторы также показали, что выбор активации в трёхслойном MLP существенно влияет на результат, и выпустили [официальный код и checkpoints](https://github.com/drkkgy/NR_IQA_AGM).

Значит, вопрос «какая SOTA-голова лучше на CLIP и SigLIP» слишком широк и частично закрыт. Однако работа WACV в основном изучает итоговый feature и MLP/activation. Хороший школьный вопрос остаётся:

> Окупается ли агрегация patch- и intermediate-layer tokens по сравнению с сильным gated MLP над pooled feature, если backbone полностью frozen?

### Ошибка в атрибуции протокола Q-Align

[Q-Align](https://proceedings.mlr.press/v235/wu24ah.html) — LMM на базе mPLUG-Owl2, обучаемый выдавать пять дискретных текстовых уровней качества. Mixed-data обучение действительно использует KADID-10k + KonIQ-10k + SPAQ, но предлагаемая школа использует frozen encoders, scalar heads и собственный набор held-out баз. Поэтому корректная формулировка: «mixed train set вдохновлён Q-Align», а не «прямое сравнение по протоколу Q-Align».

### Почему PIPAL и PieAPP не должны быть core NR-IQA тестами

- [PIPAL](https://github.com/HaomingCai/PIPAL-dataset) создан как full-reference perceptual benchmark для restoration outputs. Можно использовать distorted-only stress test с released training Elo scores, но это отдельная адаптация.
- [PieAPP](https://github.com/prashnani/PerceptualImageError) — full-reference dataset с pairwise preference labels. Преобразование в scalar NR-IQA задачу требует отдельной модели данных и evaluation.

Core held-out набор лучше ограничить CLIVE, CSIQ, TID2013 и AGIQA-3K: authentic, synthetic, другой synthetic taxonomy и generated images.

### Рекомендованный минимальный эксперимент

- Encoders: `openai/clip-vit-large-patch14-336` и `google/siglip2-so400m-patch16-384`, frozen.
- Sanity: linear pooled probe.
- Heads: ReLU MLP; WACV-style gated MLP; single-query attention pooling; patch score × weight; four-layer gated fusion + query pooling.
- Train: KADID + KonIQ + SPAQ с одним score contract `[0,1], higher=better`.
- Core OOD: CLIVE, CSIQ, TID2013, AGIQA-3K.
- Primary result: macro OOD-SRCC; tie-break — worst-dataset SRCC.
- Cost: trainable params, head-only FLOPs, end-to-end latency p50/p95, peak VRAM.
- Compute control: shared frozen-encoder forward для всех голов; каскадный sweep — полный CLIP, затем SigLIP 2 только для strong MLP + двух лучших голов.

## Общие требования к отчёту

1. Все split-файлы и manifests версионируются.
2. Финальные числа — минимум три seed, среднее ± standard deviation.
3. Разность с baseline сопровождается 95% bootstrap confidence interval.
4. OOD test не используется для выбора hyperparameters.
5. Отрицательный результат допустим и не маскируется выбором удачного seed.
6. README содержит одну команду воспроизведения лучшей строки и точные revisions моделей/данных.

## Итоговая оценка

- **Проект 1:** хороший, потенциально публикационный controlled study, если prior и LODO определены честно. Риск средний; школа получает интерпретируемый результат даже без прироста SOTA.
- **Проект 2:** хороший инженерно-исследовательский benchmark после сужения. В исходном виде риск повторить WACV 2026 и не успеть сетку; в revised виде результат — ясный Pareto и вывод о переносимости aggregation head между encoders.
