# Description
Our trained model is a spatial linear model with 20 spatial features and various other predictor variables to predict crop water stress index (CWSI). The spatial features were constructed using bisquare basis functions to capture the spatial trends. The spatial linear model then took these features and used an exponential spatial covariance structure to account for residual correlation between nearby points. The model is shown below:

CWSI ~ SLOPE + TWI + ASPECT + ECA_SHALLOW + NDVI + SF1 + SF2 + SF3 + SF4 + SF5 + SF6 + SF7 + SF8 + SF9 + SF10 + SF11 + SF12 + SF13 + SF14 + SF15 + SF16 + SF17 + SF18 + SF19 + SF20

Compared to models without the spatial features using lrtest there was a significant difference. Model performance was evaluated using 10 fold cross validation, and the median root mean squared error (RMSE) was  0.35. When compared to the standard deviation of CWSI (0.6) we can see a significant reduction in uncertainty (our model removes roughly 40% of the uncertainty compared to a blind guess). This indicates that the spatial linear model does a good job at predicting.

# Dependencies
`fields` to make centers for spatial features

`spmodel` for the spatial linear model

`ggplot2` for the graph

`viridis` colorblind friendly colors

`patchwork` put graphs together


# Objects
`spatial_df`
- **Description** - From the crop data, we added 20 spatial features (SF1 - SF20), constructed from the spatial coordinates POINT_X and POINT_Y, to the data frame. The other variables included with the spatial features in the data frame include CWSI, SLOPE, TWI, ASPECT, ECA_SHALLOW, and NDVI. We used spatial_df to help us later fit our spatial regression model.
- **Class** - tibble (data frame)

`spatial_lm`
- **Description** - We fit a spatial linear model (splm) using spatial_df. CWSI is the response variable, and the other variables in spatial_df are the predictors for the model. 
- **Class** - splm

`pred_grid_results`
- **Description** - pred_grid_results is a data frame containing prediction results at locations where CWSI is NA. It includes the original covariates, constructed spatial features, and model based predictions. This allows us to find the point estimates (fit) and 95% prediction interval (lwr, upr) by generating the predictions from spatial_lm. 
- **Class** - tibble (data frame)

# Usage
```{r}
# packages
library(ggplot2)
library(spmodel)   # splm (spatial linear models)
library(viridis)   # colorblind friendly colors
library(patchwork) # put graphs together

# data
load("CropStress-potato.RData")

# Predictions
preds <- predict(spatial_lm, newdata = pred_data_final, interval = "prediction", level = 0.95)

# Attach back to our grid
pred_grid_results <- pred_data_final %>%
  mutate(
    fit = preds[,1],
    lwr = preds[,2],
    upr = preds[,3]
  )

# Plots
min_val <- min(c(pred_grid_results$fit, pred_grid_results$lwr, pred_grid_results$upr), na.rm = TRUE)
max_val <- max(c(pred_grid_results$fit, pred_grid_results$lwr, pred_grid_results$upr), na.rm = TRUE)
shared_limits <- c(min_val, max_val)

fitplot <- ggplot(pred_grid_results, aes(x = POINT_X, y = POINT_Y)) +
  geom_point(aes(color = fit), size = 1) +
  scale_color_viridis_c(limits = shared_limits) + # Syncing here
  labs(title = "Predicted CWSI (Fit)", x = "X coord", y = "Y coord", color = "CWSI") +
  theme_minimal()

lwrplot <- ggplot(pred_grid_results, aes(x = POINT_X, y = POINT_Y)) +
  geom_point(aes(color = lwr), size = 1) +
  scale_color_viridis_c(limits = shared_limits) + # Syncing here
  labs(title = "Lower 95% Bound", x = "X coord", y = "Y coord", color = "CWSI") +
  theme_minimal()

uprplot <- ggplot(pred_grid_results, aes(x = POINT_X, y = POINT_Y)) +
  geom_point(aes(color = upr), size = 1) +
  scale_color_viridis_c(limits = shared_limits) + # Syncing here
  labs(title = "Upper 95% Bound", x = "X coord", y = "Y coord", color = "CWSI") +
  theme_minimal()

(fitplot / (lwrplot + uprplot)) + 
  plot_layout(heights = c(4, 2), guides = "collect")& 
  coord_fixed() & 
  theme(legend.position = "right")
```

# Output
The code snippet takes our pred_data_final to create predictions for the empty CWSI locations. We then make model based predictions. This allows us to find the point estimates (fit) and 95% prediction interval (lwr, upr) by generating the predictions from spatial_lm. The output from generating these predictions is a graph with 3 distinct maps displaying the predicted, lower bound, and upper bound CWSI values.
