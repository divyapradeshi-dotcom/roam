import {CommentIcon} from '@sanity/icons'
import React from 'react'
import {defineField, defineType} from 'sanity'

export const review = defineType({
  name: 'review',
  title: 'Guest review',
  type: 'document',
  icon: CommentIcon,
  fields: [
    defineField({
      name: 'property',
      type: 'reference',
      to: [{type: 'property'}],
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'guestName', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'rating',
      type: 'number',
      validation: (rule) => rule.required().integer().min(1).max(5),
    }),
    defineField({name: 'stayedAt', type: 'date', validation: (rule) => rule.required()}),
    defineField({name: 'text', type: 'text', rows: 4, validation: (rule) => rule.required()}),
    defineField({
      name: 'seedKey',
      type: 'string',
      hidden: true,
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      guestName: 'guestName',
      text: 'text',
      stayTitle: 'property.title',
      imageUrl: 'property.photos.0.url',
    },
    prepare({guestName, text, stayTitle, imageUrl}) {
      return {
        title: stayTitle ? `${guestName} · ${stayTitle}` : guestName,
        subtitle: text,
        media: imageUrl
          ? () =>
              React.createElement('img', {
                src: imageUrl,
                alt: stayTitle || '',
                style: {width: '100%', height: '100%', objectFit: 'cover'},
              })
          : CommentIcon,
      }
    },
  },
})
