import {ImageIcon} from '@sanity/icons'
import {Card, Stack} from '@sanity/ui'
import React from 'react'
import {defineField, defineType, type ObjectInputProps} from 'sanity'

function StayPhotoInput(props: ObjectInputProps) {
  const value = props.value as {url?: string; alt?: string} | undefined
  const url = value?.url
  const alt = value?.alt

  return React.createElement(
    Stack,
    {space: 3} as any,
    url
      ? React.createElement(
          Card,
          {border: true, radius: 2, overflow: 'hidden', style: {maxWidth: 480}} as any,
          React.createElement('img', {
            src: url,
            alt: alt || 'Stay photo preview',
            style: {
              width: '100%',
              maxHeight: 260,
              objectFit: 'cover',
              display: 'block',
            },
          }),
        )
      : null,
    props.renderDefault(props),
  )
}

export const stayPhoto = defineType({
  name: 'stayPhoto',
  title: 'Stay photo',
  type: 'object',
  icon: ImageIcon,
  components: {
    input: StayPhotoInput,
  },
  fields: [
    defineField({
      name: 'url',
      title: 'Image URL',
      type: 'url',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      validation: (rule) => rule.required().max(160),
    }),
    defineField({name: 'caption', type: 'string', title: 'Caption'}),
  ],
  preview: {
    select: {title: 'alt', subtitle: 'caption', imageUrl: 'url'},
    prepare({title, subtitle, imageUrl}) {
      return {
        title: title || 'Photo',
        subtitle,
        media: imageUrl
          ? () =>
              React.createElement('img', {
                src: imageUrl,
                alt: title || '',
                style: {width: '100%', height: '100%', objectFit: 'cover'},
              })
          : ImageIcon,
      }
    },
  },
})
