from .models import RunningLineText


def running_line_context(request):
    """Додає текст бігучої стрічки у всі templates"""
    try:
        running_line = RunningLineText.objects.filter(is_active=True).first()
        return {
            'running_line_text': running_line.text if running_line else ''
        }
    except:
        return {'running_line_text': ''}


