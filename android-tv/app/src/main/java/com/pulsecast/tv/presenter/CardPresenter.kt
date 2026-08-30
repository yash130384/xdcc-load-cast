package com.pulsecast.tv.presenter

import android.content.Context
import android.graphics.drawable.Drawable
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.leanback.widget.ImageCardView
import androidx.leanback.widget.Presenter
import com.bumptech.glide.Glide
import com.pulsecast.tv.R
import com.pulsecast.tv.api.ApiClient
import com.pulsecast.tv.model.MediaItem

class CardPresenter : Presenter() {

    private var defaultCardImage: Drawable? = null
    private var selectedBackgroundColor: Int = 0
    private var defaultBackgroundColor: Int = 0

    companion object {
        private const val CARD_WIDTH = 260
        private const val CARD_HEIGHT = 380
    }

    override fun onCreateViewHolder(parent: ViewGroup): ViewHolder {
        val context = parent.context
        defaultBackgroundColor = ContextCompat.getColor(context, R.color.card_background)
        selectedBackgroundColor = ContextCompat.getColor(context, R.color.card_selected)
        defaultCardImage = ContextCompat.getDrawable(context, R.drawable.tv_banner)

        val cardView = object : ImageCardView(context) {
            override fun setSelected(selected: Boolean) {
                updateCardBackgroundColor(this, selected)
                super.setSelected(selected)
            }
        }

        cardView.isFocusable = true
        cardView.isFocusableInTouchMode = true
        updateCardBackgroundColor(cardView, false)
        return ViewHolder(cardView)
    }

    private fun updateCardBackgroundColor(view: ImageCardView, selected: Boolean) {
        val color = if (selected) selectedBackgroundColor else defaultBackgroundColor
        view.setBackgroundColor(color)
        view.setInfoAreaBackgroundColor(color)
    }

    override fun onBindViewHolder(viewHolder: ViewHolder, item: Any) {
        val mediaItem = item as? MediaItem ?: return
        val cardView = viewHolder.view as ImageCardView

        cardView.titleText = mediaItem.displayTitle
        cardView.contentText = mediaItem.displaySubtitle
        cardView.setMainImageDimensions(CARD_WIDTH, CARD_HEIGHT)

        val posterUrl = ApiClient.getPosterUrl(mediaItem.displayPoster)
        if (!posterUrl.isNullOrEmpty()) {
            Glide.with(viewHolder.view.context)
                .load(posterUrl)
                .centerCrop()
                .error(defaultCardImage)
                .into(cardView.mainImageView)
        } else {
            cardView.mainImage = defaultCardImage
        }
    }

    override fun onUnbindViewHolder(viewHolder: ViewHolder) {
        val cardView = viewHolder.view as ImageCardView
        cardView.badgeImage = null
        cardView.mainImage = null
    }
}
